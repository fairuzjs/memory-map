import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/shop/purchase  { itemId: string }
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

    const [item, user, existingInventory] = await Promise.all([
        prisma.shopItem.findUnique({ where: { id: itemId } }),
        prisma.user.findUnique({ where: { id: userId }, select: { points: true } }),
        prisma.userInventory.findUnique({ where: { userId_itemId: { userId, itemId } } }),
    ])

    if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }
    if (existingInventory) {
        return NextResponse.json({ error: "Item already owned" }, { status: 409 })
    }
    if (!user || user.points < item.price) {
        return NextResponse.json({ error: "Insufficient points" }, { status: 402 })
    }

    // Atomic: deduct points + add to inventory
    const [, inventory] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { points: { decrement: item.price } },
        }),
        prisma.userInventory.create({
            data: { userId, itemId },
        }),
    ])

    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
    })

    return NextResponse.json({
        success: true,
        inventory,
        newPoints: updatedUser?.points ?? 0,
    })
}
