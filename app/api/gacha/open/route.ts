import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// ── Tier Configuration ──────────────────────────────────────────
// Drop rates must sum to 100
const TIER_CONFIG = {
    BASIC:  { minPrice: 0,   maxPrice: 100, dropRate: 55 },
    ELITE:  { minPrice: 101, maxPrice: 175, dropRate: 30 },
    EPIC:   { minPrice: 176, maxPrice: 275, dropRate: 12 },
    LEGEND: { minPrice: 276, maxPrice: Infinity, dropRate: 3 },
} as const

type TierName = keyof typeof TIER_CONFIG

const BOX_PRICE_SINGLE = 20
const BOX_PRICE_MULTI = 85 // 5x box, discount (saves 15 poin)
const MULTI_COUNT = 5
const DUPLICATE_REFUND = 5

// Exclude PREMIUM_FEATURE from pool
const EXCLUDED_TYPES = ["PREMIUM_FEATURE"]

function getTierForPrice(price: number): TierName {
    if (price <= 100) return "BASIC"
    if (price <= 175) return "ELITE"
    if (price <= 275) return "EPIC"
    return "LEGEND"
}

function rollTier(): TierName {
    const roll = Math.random() * 100
    let cumulative = 0
    for (const [tier, cfg] of Object.entries(TIER_CONFIG)) {
        cumulative += cfg.dropRate
        if (roll < cumulative) return tier as TierName
    }
    return "BASIC" // fallback
}

function pickRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

// POST /api/gacha/open  { count: 1 | 5 }
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const count: number = body.count === 5 ? 5 : 1
    const totalCost = count === 5 ? BOX_PRICE_MULTI : BOX_PRICE_SINGLE

    // 1. Fetch user points
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
    })

    if (!user || user.points < totalCost) {
        return NextResponse.json(
            { error: "Insufficient points", required: totalCost, current: user?.points ?? 0 },
            { status: 402 }
        )
    }

    // 2. Fetch all shop items excluding PREMIUM_FEATURE
    const allItems = await prisma.shopItem.findMany({
        where: { type: { notIn: EXCLUDED_TYPES as any } },
    })

    if (allItems.length === 0) {
        return NextResponse.json({ error: "No items in gacha pool" }, { status: 500 })
    }

    // 3. Group items by tier
    const itemsByTier: Record<TierName, typeof allItems> = {
        BASIC: [],
        ELITE: [],
        EPIC: [],
        LEGEND: [],
    }
    for (const item of allItems) {
        const tier = getTierForPrice(item.price)
        itemsByTier[tier].push(item)
    }

    // 4. Fetch owned items
    const ownedInventory = await prisma.userInventory.findMany({
        where: { userId },
        select: { itemId: true },
    })
    const ownedIds = new Set(ownedInventory.map(inv => inv.itemId))

    // 5. Check if user owns ALL items
    const unownedCount = allItems.filter(i => !ownedIds.has(i.id)).length
    if (unownedCount === 0) {
        return NextResponse.json(
            { error: "Kamu sudah memiliki semua item! Tidak bisa membuka box lagi." },
            { status: 409 }
        )
    }

    // 6. Roll items
    const results: Array<{
        item: typeof allItems[0]
        tier: TierName
        isDuplicate: boolean
        refundAmount: number
    }> = []

    let totalRefund = 0

    for (let i = 0; i < count; i++) {
        // Roll tier
        let tier = rollTier()

        // If rolled tier has no items, fallback to another tier
        let attempts = 0
        while (itemsByTier[tier].length === 0 && attempts < 10) {
            tier = rollTier()
            attempts++
        }
        if (itemsByTier[tier].length === 0) {
            // Ultimate fallback: pick from BASIC
            tier = "BASIC"
        }

        // Pick random item from the tier
        const item = pickRandomItem(itemsByTier[tier])
        const isDuplicate = ownedIds.has(item.id)
        const refundAmount = isDuplicate ? DUPLICATE_REFUND : 0

        if (!isDuplicate) {
            ownedIds.add(item.id) // prevent duplicate within multi-roll
        }

        totalRefund += refundAmount

        results.push({ item, tier, isDuplicate, refundAmount })
    }

    // 7. Execute transaction: deduct points, add to inventory, log gacha
    const effectiveCost = totalCost - totalRefund

    const transactionOps: any[] = [
        // Deduct points (cost minus refunds)
        prisma.user.update({
            where: { id: userId },
            data: { points: { decrement: effectiveCost } },
        }),
    ]

    // Add new items to inventory (skip duplicates)
    for (const result of results) {
        if (!result.isDuplicate) {
            transactionOps.push(
                prisma.userInventory.create({
                    data: { userId, itemId: result.item.id },
                })
            )
        }
    }

    // Log all gacha results
    for (const result of results) {
        transactionOps.push(
            prisma.gachaLog.create({
                data: {
                    userId,
                    itemId: result.item.id,
                    tier: result.tier,
                    isDuplicate: result.isDuplicate,
                    refundAmount: result.refundAmount,
                },
            })
        )
    }

    await prisma.$transaction(transactionOps)

    // 8. Get updated points
    const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
    })

    return NextResponse.json({
        results: results.map(r => ({
            item: {
                id: r.item.id,
                name: r.item.name,
                description: r.item.description,
                price: r.item.price,
                type: r.item.type,
                value: r.item.value,
                previewColor: r.item.previewColor,
            },
            tier: r.tier,
            isDuplicate: r.isDuplicate,
            refundAmount: r.refundAmount,
        })),
        totalCost,
        totalRefund,
        effectiveCost,
        newPoints: updatedUser?.points ?? 0,
    })
}
