import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
    getUserLimits,
    PREMIUM_PRICING,
} from "@/lib/premium-config"
import { getPremiumStatus } from "@/lib/premium-status"
import { getSpotifyAccess } from "@/lib/spotify-access"
import { checkAndCleanupPremium } from "@/lib/premium-enforcement"

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
                id: true,
                isPremium: true,
                premiumExpiresAt: true,
                freeGachaPullsUsed: true,
                freeGachaPullsResetAt: true,
                streakFreezesUsed: true,
                streakFreezesResetAt: true,
                premiumItemsClaimed: true,
                points: true,
                inventories: {
                    include: { item: { select: { type: true, value: true } } }
                }
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 1. Lazy cleanup
        await checkAndCleanupPremium(user)

        // 2. Premium status
        const pStatus = getPremiumStatus(user)
        const active = pStatus.isActive
        const limits = getUserLimits(active)
        
        // 3. Spotify Access
        const spotifyAccess = getSpotifyAccess(user, user.inventories)

        // Calculate free gacha pulls remaining this week
        const now = new Date()
        let freeGachaPullsRemaining = 0
        if (active) {
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
            isPremium: pStatus.isActive,     // fallback for older clients
            activePremium: pStatus.isActive,
            isInGracePeriod: pStatus.isInGracePeriod,
            isExpired: pStatus.isExpired,
            premiumExpiresAt: pStatus.expiresAt,
            graceEndsAt: pStatus.graceEndsAt,
            daysRemaining: pStatus.daysRemaining,
            graceDaysRemaining: pStatus.graceDaysRemaining,
            canRenew: pStatus.isExpired || pStatus.isInGracePeriod || pStatus.daysRemaining < 7,
            spotifyAccess,
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
