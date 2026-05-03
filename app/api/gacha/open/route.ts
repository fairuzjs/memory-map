import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { isPremiumActive, getUserLimits } from "@/lib/premium-config"

// ── Tier Configuration ──────────────────────────────────────────
// Drop rates must sum to 100
const TIER_CONFIG = {
    BASIC:  { minPrice: 0,   maxPrice: 100 },
    ELITE:  { minPrice: 101, maxPrice: 175 },
    EPIC:   { minPrice: 176, maxPrice: 275 },
    LEGEND: { minPrice: 276, maxPrice: Infinity },
} as const

type TierName = keyof typeof TIER_CONFIG

export type BoosterLevel = 0 | 1 | 2 | 3;

export const BOOSTER_CONFIGS: Record<BoosterLevel, { name: string, single: number, multi: number, rates: Record<TierName, number> }> = {
    0: { name: "Default", single: 20, multi: 85, rates: { BASIC: 55, ELITE: 30, EPIC: 12, LEGEND: 3 } },
    1: { name: "Biasa Aja", single: 40, multi: 185, rates: { BASIC: 50, ELITE: 25, EPIC: 15, LEGEND: 10 } },
    2: { name: "Cacing Naga", single: 60, multi: 285, rates: { BASIC: 35, ELITE: 30, EPIC: 20, LEGEND: 15 } },
    3: { name: "Aura 999+", single: 80, multi: 385, rates: { BASIC: 10, ELITE: 35, EPIC: 35, LEGEND: 20 } },
}

// Exclude PREMIUM_FEATURE from pool
const EXCLUDED_TYPES = ["PREMIUM_FEATURE"]
const EXCLUDED_NAMES = ["Cuddlysun", "Shape Coquette", "Grape Blossom", "Soft Bubble Tea", "Mahkota Royale", "Langit Kerajaan"]

function getTierForPrice(price: number): TierName {
    if (price <= 100) return "BASIC"
    if (price <= 175) return "ELITE"
    if (price <= 275) return "EPIC"
    return "LEGEND"
}

function rollTier(booster: BoosterLevel): TierName {
    const roll = Math.random() * 100
    let cumulative = 0
    const rates = BOOSTER_CONFIGS[booster].rates
    for (const tier of ["BASIC", "ELITE", "EPIC", "LEGEND"] as TierName[]) {
        cumulative += rates[tier]
        if (roll < cumulative) return tier
    }
    return "BASIC" // fallback
}

function pickRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

/** Get next Monday 00:00 WIB as the weekly reset time */
function getNextMondayWIB(): Date {
    const now = new Date()
    const wibOffset = 7 * 60 * 60 * 1000
    const wibNow = new Date(now.getTime() + wibOffset)
    const day = wibNow.getUTCDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    const nextMonday = new Date(wibNow)
    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday)
    nextMonday.setUTCHours(0, 0, 0, 0)
    return new Date(nextMonday.getTime() - wibOffset) // convert back to UTC
}

// POST /api/gacha/open  { count: 1 | 5, booster: 0-3, useFreePull?: boolean }
export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate Limit — 50 gacha per jam per user
    const rl = checkRateLimit(`gacha:${session.user.id}`, RATE_LIMITS.GACHA.limit, RATE_LIMITS.GACHA.windowMs)
    if (!rl.success) return rateLimitResponse(rl.reset)

    const userId = session.user.id
    const body = await req.json()
    const count: number = body.count === 5 ? 5 : 1
    const boosterId = parseInt(body.booster)
    const boosterLevel: BoosterLevel = (boosterId === 1 || boosterId === 2 || boosterId === 3) ? boosterId : 0
    const useFreePull: boolean = body.useFreePull === true

    const boosterConfig = BOOSTER_CONFIGS[boosterLevel]
    const baseCost = count === 5 ? boosterConfig.multi : boosterConfig.single

    // 1. Fetch user data (points + premium status + free gacha tracking)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            points: true,
            premiumExpiresAt: true,
            freeGachaPullsUsed: true,
            freeGachaPullsResetAt: true,
        },
    })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ── Premium checks ──
    const userIsPremium = isPremiumActive(user.premiumExpiresAt)
    const limits = getUserLimits(userIsPremium)
    const duplicateRefund = limits.duplicateRefund

    // ── Free pull logic ──
    let actualFreePulls = 0
    let totalCost = baseCost

    if (useFreePull && userIsPremium && limits.freeGachaPullsPerWeek > 0) {
        const now = new Date()
        let pullsUsed = user.freeGachaPullsUsed
        if (!user.freeGachaPullsResetAt || now >= user.freeGachaPullsResetAt) {
            pullsUsed = 0 // weekly reset
        }

        const pullsRemaining = limits.freeGachaPullsPerWeek - pullsUsed
        actualFreePulls = Math.min(count, pullsRemaining)

        if (actualFreePulls > 0) {
            if (actualFreePulls >= count) {
                totalCost = 0 // all pulls are free
            } else {
                totalCost = (count - actualFreePulls) * boosterConfig.single
            }
        }
    }

    if (totalCost > 0 && user.points < totalCost) {
        return NextResponse.json(
            { error: "Insufficient points", required: totalCost, current: user.points },
            { status: 402 }
        )
    }

    // 2. Fetch all shop items excluding PREMIUM_FEATURE and SPECIAL items
    const allItems = await prisma.shopItem.findMany({
        where: {
            type: { notIn: EXCLUDED_TYPES as any },
            name: { notIn: EXCLUDED_NAMES },
        },
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

    // ── Pity system: count pulls since last Legend (only for default booster) ──
    let pullsSinceLastLegend = 0
    if (userIsPremium && limits.pityGuarantee && boosterLevel === 0) {
        const recentLogs = await prisma.gachaLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limits.pityGuarantee,
            select: { tier: true },
        })
        for (const log of recentLogs) {
            if (log.tier === "LEGEND") break
            pullsSinceLastLegend++
        }
    }

    // 6. Roll items
    const results: Array<{
        item: typeof allItems[0]
        tier: TierName
        isDuplicate: boolean
        refundAmount: number
        isPityTriggered: boolean
    }> = []

    let totalRefund = 0
    let currentPity = pullsSinceLastLegend

    for (let i = 0; i < count; i++) {
        let tier: TierName
        let isPityTriggered = false

        // ── Pity check ──
        if (
            userIsPremium &&
            limits.pityGuarantee &&
            boosterLevel === 0 &&
            (currentPity + 1) >= limits.pityGuarantee &&
            itemsByTier.LEGEND.length > 0
        ) {
            tier = "LEGEND"
            isPityTriggered = true
        } else {
            tier = rollTier(boosterLevel)

            let attempts = 0
            while (itemsByTier[tier].length === 0 && attempts < 10) {
                tier = rollTier(boosterLevel)
                attempts++
            }
            if (itemsByTier[tier].length === 0) {
                tier = "BASIC"
            }
        }

        // Update pity counter based on actual rolled tier
        if (boosterLevel === 0) {
            if (tier === "LEGEND") {
                currentPity = 0
            } else {
                currentPity++
            }
        }

        const item = pickRandomItem(itemsByTier[tier])
        const isDuplicate = ownedIds.has(item.id)
        const refundAmount = isDuplicate ? duplicateRefund : 0

        if (!isDuplicate) {
            ownedIds.add(item.id)
        }

        totalRefund += refundAmount
        results.push({ item, tier, isDuplicate, refundAmount, isPityTriggered })
    }

    // 7. Execute transaction
    const effectiveCost = totalCost - totalRefund
    const transactionOps: any[] = []

    // Deduct points (only if there's a cost)
    if (effectiveCost !== 0) {
        transactionOps.push(
            prisma.user.update({
                where: { id: userId },
                data: { points: { decrement: effectiveCost } },
            })
        )
    }

    // Update free pull tracking if used
    if (actualFreePulls > 0) {
        const now = new Date()
        const needsReset = !user.freeGachaPullsResetAt || now >= user.freeGachaPullsResetAt
        transactionOps.push(
            prisma.user.update({
                where: { id: userId },
                data: {
                    freeGachaPullsUsed: needsReset ? actualFreePulls : { increment: actualFreePulls },
                    ...(needsReset ? { freeGachaPullsResetAt: getNextMondayWIB() } : {}),
                },
            })
        )
    }

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
        select: { points: true, freeGachaPullsUsed: true, freeGachaPullsResetAt: true },
    })

    // Calculate remaining free pulls for response
    let freeGachaPullsRemaining = 0
    if (userIsPremium) {
        const now = new Date()
        const pullsUsed = (!updatedUser?.freeGachaPullsResetAt || now >= updatedUser.freeGachaPullsResetAt)
            ? 0
            : (updatedUser?.freeGachaPullsUsed ?? 0)
        freeGachaPullsRemaining = Math.max(0, limits.freeGachaPullsPerWeek - pullsUsed)
    }

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
            isPityTriggered: r.isPityTriggered,
        })),
        totalCost,
        totalRefund,
        effectiveCost,
        newPoints: updatedUser?.points ?? 0,
        freePullsUsed: actualFreePulls,
        freeGachaPullsRemaining,
        pityCounter: boosterLevel === 0 ? currentPity : undefined,
    })
}
