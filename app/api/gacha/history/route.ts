import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/gacha/history — Returns user's gacha history (last 50)
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logs = await prisma.gachaLog.findMany({
        where: { userId: session.user.id },
        include: {
            item: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    price: true,
                    previewColor: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    })

    // Aggregate stats
    const stats = {
        totalOpened: logs.length,
        byTier: {
            BASIC: logs.filter(l => l.tier === "BASIC").length,
            ELITE: logs.filter(l => l.tier === "ELITE").length,
            EPIC: logs.filter(l => l.tier === "EPIC").length,
            LEGEND: logs.filter(l => l.tier === "LEGEND").length,
        },
        duplicates: logs.filter(l => l.isDuplicate).length,
        totalRefunded: logs.reduce((sum, l) => sum + l.refundAmount, 0),
    }

    return NextResponse.json({ logs, stats })
}
