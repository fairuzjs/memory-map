import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

export async function POST() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const todayWIB = getWIBDateString(now)

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
    if (lastWIB === yesterdayWIB) {
        // Hari berturut-turut
        newStreak = streak.currentStreak + 1
    } else {
        // Streak baru / terputus
        newStreak = 1
    }

    const newLongest = Math.max(newStreak, streak.longestStreak)
    const newTotalDays = streak.totalActiveDays + 1

    // Calculate points
    const pointsEarned = calcPointsForStreak(newStreak)

    // Update streak + grant points atomically
    const [updatedStreak] = await prisma.$transaction([
        prisma.userStreak.update({
            where: { userId },
            data: {
                currentStreak: newStreak,
                longestStreak: newLongest,
                totalActiveDays: newTotalDays,
                lastClaimedAt: now,
            },
        }),
        prisma.user.update({
            where: { id: userId },
            data: { points: { increment: pointsEarned } },
        }),
    ])

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

    return NextResponse.json({
        alreadyClaimed: false,
        streak: updatedStreak,
        pointsEarned,
        newBadges,
        badges: badges.map((b) => ({ milestone: b.milestone, earnedAt: b.earnedAt })),
        nextMilestone,
        daysToNext,
    })
}
