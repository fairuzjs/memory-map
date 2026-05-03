import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/shop — Returns all shop items with ownership info for the current user
export async function GET() {
    const session = await auth()
    const userId = session?.user?.id ?? null

    // Exclude premium-exclusive items (granted via premium activation, not for sale)
    const PREMIUM_EXCLUSIVE_NAMES = ["Mahkota Royale", "Langit Kerajaan"]

    const items = await prisma.shopItem.findMany({
        where: { name: { notIn: PREMIUM_EXCLUSIVE_NAMES } },
        orderBy: [{ type: "asc" }, { price: "asc" }],
    })

    // If logged in, find what the user already owns
    let ownedItemIds: Set<string> = new Set()
    let equippedItemIds: Set<string> = new Set()
    if (userId) {
        const inventory = await prisma.userInventory.findMany({
            where: { userId },
            select: { itemId: true, isEquipped: true },
        })
        inventory.forEach((inv) => {
            ownedItemIds.add(inv.itemId)
            if (inv.isEquipped) equippedItemIds.add(inv.itemId)
        })

        // Also return user's point balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true },
        })

        return NextResponse.json({
            items: items.map((item) => ({
                ...item,
                owned: ownedItemIds.has(item.id),
                equipped: equippedItemIds.has(item.id),
            })),
            points: user?.points ?? 0,
        })
    }

    return NextResponse.json({
        items: items.map((item) => ({ ...item, owned: false, equipped: false })),
        points: 0,
    })
}
