import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/inventory/premium — Returns premium feature values the user owns
// Used by memory create/edit forms to check if Spotify is unlocked
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ features: [] })
    }

    const premiumItems = await prisma.userInventory.findMany({
        where: {
            userId: session.user.id,
            item: { type: "PREMIUM_FEATURE" },
        },
        select: {
            item: {
                select: { id: true, value: true, name: true, price: true }
            }
        }
    })

    // Also return user's point balance for quick-purchase
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { points: true }
    })

    return NextResponse.json({
        features: premiumItems.map(inv => inv.item.value),
        items: premiumItems.map(inv => inv.item),
        points: user?.points ?? 0,
    })
}
