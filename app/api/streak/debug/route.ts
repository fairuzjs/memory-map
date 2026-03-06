import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Endpoint khusus DEVELOPMENT untuk testing Daily Streak
export async function POST(req: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { setDays } = body

        if (typeof setDays !== "number") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
        }

        const userId = session.user.id

        // Atur lastClaimedAt ke kemarin agar user bisa nge-klik tombol "Klaim" hari ini
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

        if (setDays === 0) {
            // Hard Reset
            await prisma.userStreakBadge.deleteMany({ where: { userId } })
            await prisma.userStreak.update({
                where: { userId },
                data: {
                    currentStreak: 0,
                    longestStreak: 0,
                    totalActiveDays: 0,
                    lastClaimedAt: null,
                }
            })
            return NextResponse.json({ success: true, message: "Streak and badges reset" })
        }

        // Setup streak ke -1 dari target sehingga klaim berikutnya pas kena milestone
        const streak = await prisma.userStreak.findUnique({ where: { userId } })

        await prisma.userStreak.upsert({
            where: { userId },
            update: {
                currentStreak: setDays,
                longestStreak: Math.max(streak?.longestStreak || 0, setDays),
                lastClaimedAt: yesterday,
            },
            create: {
                userId,
                currentStreak: setDays,
                longestStreak: setDays,
                totalActiveDays: setDays,
                lastClaimedAt: yesterday,
            }
        })

        // Hapus badge yang lebih besar dari setDays agar milestone bisa didapat lagi
        await prisma.userStreakBadge.deleteMany({
            where: {
                userId,
                milestone: { gt: setDays }
            }
        })

        return NextResponse.json({ success: true, setDays })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
