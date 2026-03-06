import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper: konversi Date (UTC) ke string tanggal WIB (UTC+7) "YYYY-MM-DD"
function getWIBDateString(date: Date): string {
    const wibTime = date.getTime() + 7 * 60 * 60 * 1000
    const wibDate = new Date(wibTime)
    return wibDate.toISOString().split("T")[0]
}

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const todayWIB = getWIBDateString(now)

    // Ambil atau buat data streak
    let streak = await prisma.userStreak.findUnique({ where: { userId } })
    if (!streak) {
        streak = await prisma.userStreak.create({
            data: { userId },
        })
    }

    // Ambil semua badge user
    const badges = await prisma.userStreakBadge.findMany({
        where: { userId },
        orderBy: { milestone: "asc" },
    })

    // Cek apakah sudah klaim hari ini (WIB)
    const alreadyClaimed = streak.lastClaimedAt
        ? getWIBDateString(streak.lastClaimedAt) === todayWIB
        : false

    // Tentukan milestone badge berikutnya
    const milestones = [7, 30, 60, 90]
    const earnedMilestones = badges.map((b) => b.milestone)
    const nextMilestone = milestones.find((m) => !earnedMilestones.includes(m)) ?? null
    const daysToNext = nextMilestone !== null ? nextMilestone - streak.currentStreak : null

    return NextResponse.json({
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalActiveDays: streak.totalActiveDays,
        lastClaimedAt: streak.lastClaimedAt,
        alreadyClaimed,
        badges: badges.map((b) => ({ milestone: b.milestone, earnedAt: b.earnedAt })),
        nextMilestone,
        daysToNext,
    })
}
