import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const topStreakers = await prisma.userStreak.findMany({
        where: {
            longestStreak: { gt: 0 },
        },
        orderBy: { longestStreak: "desc" },
        take: 50,
        include: {
            user: {
                select: { id: true, name: true, image: true },
            },
        },
    })

    return NextResponse.json(
        topStreakers.map((s, i) => ({
            rank: i + 1,
            userId: s.user.id,
            name: s.user.name,
            image: s.user.image,
            longestStreak: s.longestStreak,
            currentStreak: s.currentStreak,
        }))
    )
}
