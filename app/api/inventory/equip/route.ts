import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

// POST /api/inventory/equip  { itemId: string } — toggles equipped state
// Only one item per ItemType may be equipped at a time; equipping a new one unequips the old one.
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { itemId } = await req.json()

    if (!itemId) {
        return NextResponse.json({ error: "itemId is required" }, { status: 400 })
    }

    // Confirm user owns the item and get its type
    const inventoryEntry = await prisma.userInventory.findUnique({
        where: { userId_itemId: { userId, itemId } },
        include: { item: { select: { type: true } } },
    })

    if (!inventoryEntry) {
        return NextResponse.json({ error: "Item not in inventory" }, { status: 404 })
    }

    const itemType = inventoryEntry.item.type
    const willBeEquipped = !inventoryEntry.isEquipped

    // Find all inventory IDs of the same type owned by this user
    const sameTypeInventory = await prisma.userInventory.findMany({
        where: {
            userId,
            item: { type: itemType },
        },
        select: { id: true },
    })
    const sameTypeIds = sameTypeInventory.map((inv) => inv.id)

    // Unequip all of same type, then equip target in a transaction
    await prisma.$transaction([
        // Unequip all items of same type
        prisma.userInventory.updateMany({
            where: { id: { in: sameTypeIds } },
            data: { isEquipped: false },
        }),
        // Equip the target item (only if toggling on)
        ...(willBeEquipped
            ? [prisma.userInventory.update({
                where: { userId_itemId: { userId, itemId } },
                data: { isEquipped: true },
            })]
            : []),
    ])

    // Revalidate user profile cache
    ;(revalidateTag as any)(CACHE_TAGS.user(userId))

    return NextResponse.json({
        success: true,
        equipped: willBeEquipped,
        itemType,
    })
}
