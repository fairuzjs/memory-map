import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { isPremiumActive, getUserLimits } from "@/lib/premium-config"

// POST /api/shop/purchase  { itemId: string }
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate Limit — 20 pembelian per jam per user
    const rl = checkRateLimit(`shop:${session.user.id}`, RATE_LIMITS.SHOP_PURCHASE.limit, RATE_LIMITS.SHOP_PURCHASE.windowMs)
    if (!rl.success) return rateLimitResponse(rl.reset)

    const userId = session.user.id
    const { itemId } = await req.json()

    if (!itemId) {
        return NextResponse.json({ error: "itemId is required" }, { status: 400 })
    }

    const [item, user, existingInventory] = await Promise.all([
        prisma.shopItem.findUnique({ where: { id: itemId } }),
        prisma.user.findUnique({ where: { id: userId }, select: { points: true, premiumExpiresAt: true } }),
        prisma.userInventory.findUnique({ where: { userId_itemId: { userId, itemId } } }),
    ])

    if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Block purchase of premium-exclusive items
    const PREMIUM_EXCLUSIVE_NAMES = ["Mahkota Royale", "Langit Kerajaan"]
    if (PREMIUM_EXCLUSIVE_NAMES.includes(item.name)) {
        return NextResponse.json({ error: "Item ini eksklusif untuk member Premium" }, { status: 403 })
    }

    if (existingInventory) {
        return NextResponse.json({ error: "Item already owned" }, { status: 409 })
    }

    // ── Premium discount ──
    const userIsPremium = isPremiumActive(user?.premiumExpiresAt ?? null)
    const limits = getUserLimits(userIsPremium)
    const discountPercent = limits.shopDiscountPercent
    const discountAmount = Math.floor(item.price * discountPercent / 100)
    const finalPrice = item.price - discountAmount

    if (!user || user.points < finalPrice) {
        return NextResponse.json({ error: "Insufficient points" }, { status: 402 })
    }

    // Atomic: deduct points + add to inventory
    const [, inventory] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { points: { decrement: finalPrice } },
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
        originalPrice: item.price,
        discountPercent,
        discountAmount,
        finalPrice,
    })
}
