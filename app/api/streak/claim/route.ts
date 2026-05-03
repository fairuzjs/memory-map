import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"
import { isPremiumActive, getUserLimits } from "@/lib/premium-config"

const MILESTONES = [7, 30, 60, 90]

// Points granted per streak day (capped at streak day 8+ → 50 pts)
function calcPointsForStreak(streakDay: number): number {
    const base = 10
    const bonus = Math.min((streakDay - 1) * 5, 40)
    return base + bonus
}

// Konversi Date (UTC) ke string WIB "YYYY-MM-DD"
function getWIBDateString(date: Date): string {
    const wibTime = date.getTime() + 7 * 60 * 60 * 1000
    const wibDate = new Date(wibTime)
    return wibDate.toISOString().split("T")[0]
}

/** Get 1st of next month 00:00 WIB as the monthly reset time */
function getFirstOfNextMonthWIB(): Date {
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const wibNow = new Date(now.getTime() + wibOffset)
    const nextMonth = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth() + 1, 1, 0, 0, 0, 0))
    return new Date(nextMonth.getTime() - wibOffset) // convert back to UTC
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse optional body — { useFreeze?: boolean, skipFreeze?: boolean }
    let useFreeze = false
    let skipFreeze = false
    try {
        const body = await req.json()
        useFreeze = body?.useFreeze === true
        skipFreeze = body?.skipFreeze === true
    } catch {
        // No body or invalid JSON — that's fine, default to false
    }

    const userId = session.user.id
    const now = new Date()
    const todayWIB = getWIBDateString(now)

    // Fetch user for premium status + streak freeze tracking
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            premiumExpiresAt: true,
            streakFreezesUsed: true,
            streakFreezesResetAt: true,
        },
    })

    const userIsPremium = isPremiumActive(currentUser?.premiumExpiresAt ?? null)
    const limits = getUserLimits(userIsPremium)

    // Ambil atau buat data streak user
    let streak = await prisma.userStreak.findUnique({ where: { userId } })
    if (!streak) {
        streak = await prisma.userStreak.create({ data: { userId } })
    }

    // Cek sudah klaim hari ini (WIB)
    if (streak.lastClaimedAt) {
        const lastClaimedWIB = getWIBDateString(streak.lastClaimedAt)
        if (lastClaimedWIB === todayWIB) {
            return NextResponse.json({ alreadyClaimed: true, streak })
        }
    }

    // Hitung apakah kemarin (WIB)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayWIB = getWIBDateString(yesterday)
    const lastWIB = streak.lastClaimedAt ? getWIBDateString(streak.lastClaimedAt) : null

    let newStreak: number
    let freezeUsed = false

    if (lastWIB === yesterdayWIB) {
        // Hari berturut-turut
        newStreak = streak.currentStreak + 1
    } else if (lastWIB && lastWIB !== yesterdayWIB) {
        // ── Streak freeze: cek apakah user skip tepat 1 hari & punya freeze tersisa ──
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        const twoDaysAgoWIB = getWIBDateString(twoDaysAgo)

        // Check if last claim was exactly 2 days ago (skipped 1 day)
        if (
            userIsPremium &&
            limits.streakFreezesPerMonth > 0 &&
            lastWIB === twoDaysAgoWIB
        ) {
            // Check freeze counter (reset monthly)
            let freezesUsed = currentUser?.streakFreezesUsed ?? 0
            if (!currentUser?.streakFreezesResetAt || now >= currentUser.streakFreezesResetAt) {
                freezesUsed = 0 // monthly reset
            }

            if (freezesUsed < limits.streakFreezesPerMonth) {
                if (useFreeze) {
                    // User chose to use freeze — streak continues!
                    newStreak = streak.currentStreak + 1
                    freezeUsed = true
                } else if (skipFreeze) {
                    // User explicitly declined freeze — streak resets
                    newStreak = 1
                } else {
                    // Freeze is available but user didn't request it
                    // Return early with a prompt so frontend can show confirmation
                    return NextResponse.json({
                        needsFreezeConfirmation: true,
                        currentStreak: streak.currentStreak,
                        freezesRemaining: limits.streakFreezesPerMonth - freezesUsed,
                    })
                }
            } else {
                // No freezes left — streak resets
                newStreak = 1
            }
        } else {
            // Gap > 1 day or no freeze available — streak resets
            newStreak = 1
        }
    } else {
        // First ever claim or no last date
        newStreak = 1
    }

    const newLongest = Math.max(newStreak, streak.longestStreak)
    const newTotalDays = streak.totalActiveDays + 1

    // Calculate points with premium multiplier
    const basePoints = calcPointsForStreak(newStreak)
    const pointsEarned = Math.floor(basePoints * limits.streakMultiplier)

    // Build transaction operations
    const transactionOps: any[] = [
        prisma.userStreak.update({
            where: { userId },
            data: {
                currentStreak: newStreak,
                longestStreak: newLongest,
                totalActiveDays: newTotalDays,
                lastClaimedAt: now,
                activeDates: {
                    push: todayWIB
                }
            },
        }),
        prisma.user.update({
            where: { id: userId },
            data: { points: { increment: pointsEarned } },
        }),
    ]

    // Update freeze counter if a freeze was used
    if (freezeUsed && currentUser) {
        const needsReset = !currentUser.streakFreezesResetAt || now >= currentUser.streakFreezesResetAt
        transactionOps.push(
            prisma.user.update({
                where: { id: userId },
                data: {
                    streakFreezesUsed: needsReset ? 1 : { increment: 1 },
                    ...(needsReset ? { streakFreezesResetAt: getFirstOfNextMonthWIB() } : {}),
                },
            })
        )
    }

    // Update streak + grant points atomically
    const [updatedStreak] = await prisma.$transaction(transactionOps)

    // Cek & berikan badge milestone baru
    const newBadges: number[] = []
    for (const milestone of MILESTONES) {
        if (newStreak >= milestone) {
            // Upsert: abaikan jika sudah ada
            const existing = await prisma.userStreakBadge.findUnique({
                where: { userId_milestone: { userId, milestone } },
            })
            if (!existing) {
                await prisma.userStreakBadge.create({ data: { userId, milestone } })
                newBadges.push(milestone)
            }
        }
    }

    // Ambil semua badge terbaru
    const badges = await prisma.userStreakBadge.findMany({
        where: { userId },
        orderBy: { milestone: "asc" },
    })

    // Milestone berikutnya
    const earnedMilestones = badges.map((b) => b.milestone)
    const nextMilestone = MILESTONES.find((m) => !earnedMilestones.includes(m)) ?? null
    const daysToNext = nextMilestone !== null ? nextMilestone - newStreak : null

    // Calculate streak freezes remaining for response
    let streakFreezesRemaining = 0
    if (userIsPremium) {
        let usedCount = currentUser?.streakFreezesUsed ?? 0
        if (!currentUser?.streakFreezesResetAt || now >= currentUser.streakFreezesResetAt) {
            usedCount = 0
        }
        if (freezeUsed) usedCount++
        streakFreezesRemaining = Math.max(0, limits.streakFreezesPerMonth - usedCount)
    }

    // Revalidate leaderboard cache
    ;(revalidateTag as any)(CACHE_TAGS.leaderboard)
    // Revalidate user profile as current streak changed
    ;(revalidateTag as any)(CACHE_TAGS.user(userId))

    return NextResponse.json({
        alreadyClaimed: false,
        streak: updatedStreak,
        pointsEarned,
        basePoints,
        streakMultiplier: limits.streakMultiplier,
        freezeUsed,
        streakFreezesRemaining,
        newBadges,
        badges: badges.map((b) => ({ milestone: b.milestone, earnedAt: b.earnedAt })),
        nextMilestone,
        daysToNext,
    })
}
