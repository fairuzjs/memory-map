import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
    isPremiumActive,
    isInGracePeriod,
    premiumDaysRemaining,
    getUserLimits,
    PREMIUM_PRICING,
} from "@/lib/premium-config"

// GET /api/premium/status — dapatkan status premium lengkap user
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                isPremium: true,
                premiumExpiresAt: true,
                freeGachaPullsUsed: true,
                freeGachaPullsResetAt: true,
                streakFreezesUsed: true,
                streakFreezesResetAt: true,
                premiumItemsClaimed: true,
                points: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const active = isPremiumActive(user.premiumExpiresAt)
        const inGrace = isInGracePeriod(user.premiumExpiresAt)
        const daysRemaining = premiumDaysRemaining(user.premiumExpiresAt)
        const limits = getUserLimits(active)

        // Calculate free gacha pulls remaining this week
        const now = new Date()
        let freeGachaPullsRemaining = 0
        if (active) {
            // Check if weekly reset is needed
            if (!user.freeGachaPullsResetAt || now >= user.freeGachaPullsResetAt) {
                freeGachaPullsRemaining = limits.freeGachaPullsPerWeek
            } else {
                freeGachaPullsRemaining = Math.max(0, limits.freeGachaPullsPerWeek - user.freeGachaPullsUsed)
            }
        }

        // Calculate streak freezes remaining this month
        let streakFreezesRemaining = 0
        if (active) {
            if (!user.streakFreezesResetAt || now >= user.streakFreezesResetAt) {
                streakFreezesRemaining = limits.streakFreezesPerMonth
            } else {
                streakFreezesRemaining = Math.max(0, limits.streakFreezesPerMonth - user.streakFreezesUsed)
            }
        }

        // Calculate pity counter
        let pityCounter = 0
        if (active && limits.pityGuarantee) {
            const recentLogs = await prisma.gachaLog.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
                take: limits.pityGuarantee,
                select: { tier: true },
            })
            for (const log of recentLogs) {
                if (log.tier === "LEGEND") break
                pityCounter++
            }
        }

        // Check if there's a pending order
        const pendingOrder = await prisma.premiumOrder.findFirst({
            where: { userId: session.user.id, status: "PENDING" },
            select: { id: true, createdAt: true },
        })

        return NextResponse.json({
            isPremium: active,
            isInGracePeriod: inGrace,
            premiumExpiresAt: user.premiumExpiresAt,
            daysRemaining,
            limits,
            freeGachaPullsRemaining,
            streakFreezesRemaining,
            pityCounter,
            pendingOrder,
            pricing: PREMIUM_PRICING,
            points: user.points,
            canClaimItems: active && !user.premiumItemsClaimed,
        })
    } catch (error) {
        console.error("GET premium status error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
