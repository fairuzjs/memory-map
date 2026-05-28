import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Global cache system definition to preserve across dev hot reloads
const globalForStats = globalThis as unknown as {
    statsCache?: {
        data: any;
        expiresAt: number;
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const bypassCache = searchParams.get("bypassCache") === "true"

        // Serve from memory cache if valid and not bypassed
        const nowTime = Date.now()
        if (!bypassCache && globalForStats.statsCache && globalForStats.statsCache.expiresAt > nowTime) {
            return NextResponse.json(globalForStats.statsCache.data)
        }

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfSevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // BATCH 1: User metrics (Max 3 concurrent queries)
        const [
            totalUsers,
            newUsersToday,
            newUsersThisWeek,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.user.count({ where: { createdAt: { gte: startOfSevenDaysAgo } } }),
        ])

        // BATCH 2: Pending counts (Max 4 concurrent queries)
        const [
            pendingFeedback,
            pendingReports,
            pendingTopup,
            pendingPremium,
        ] = await Promise.all([
            prisma.feedback.count({ where: { status: "PENDING" } }),
            prisma.report.count({ where: { status: "PENDING" } }),
            prisma.topupOrder.count({ where: { status: "PENDING" } }),
            prisma.premiumOrder.count({ where: { status: "PENDING" } }),
        ])

        // BATCH 3: Detailed Lists & Action items (Max 5 concurrent queries)
        const [
            recentActivity,
            pendingTopupOrders,
            pendingPremiumOrders,
            pendingReportItems,
            pendingFeedbackItems,
        ] = await Promise.all([
            prisma.adminAuditLog.findMany({
                orderBy: { createdAt: "desc" },
                take: 6,
                include: {
                    admin: {
                        select: { name: true, email: true, image: true }
                    }
                }
            }),
            prisma.topupOrder.findMany({
                where: { status: "PENDING" },
                orderBy: { createdAt: "asc" },
                take: 3,
                include: { user: { select: { name: true, email: true } } }
            }),
            prisma.premiumOrder.findMany({
                where: { status: "PENDING" },
                orderBy: { createdAt: "asc" },
                take: 3,
                include: { user: { select: { name: true, email: true } } }
            }),
            prisma.report.findMany({
                where: { status: "PENDING" },
                orderBy: { createdAt: "asc" },
                take: 3,
                include: { reporter: { select: { name: true } }, memory: { select: { title: true } } }
            }),
            prisma.feedback.findMany({
                where: { status: "PENDING" },
                orderBy: { createdAt: "asc" },
                take: 3,
                include: { user: { select: { name: true } } }
            })
        ])

        // Format quick action queue items
        const quickActionsQueue: any[] = []

        pendingTopupOrders.forEach(item => {
            quickActionsQueue.push({
                id: item.id,
                type: "TOPUP",
                title: `Topup Order: +${item.amount.toLocaleString("id-ID")} pts`,
                description: `Oleh ${item.user.name} (${item.user.email})`,
                createdAt: item.createdAt,
                href: "/admin/topup"
            })
        })

        pendingPremiumOrders.forEach(item => {
            quickActionsQueue.push({
                id: item.id,
                type: "PREMIUM",
                title: `Premium Order: ${item.durationDays} hari`,
                description: `Oleh ${item.user.name} (${item.user.email})`,
                createdAt: item.createdAt,
                href: "/admin/premium"
            })
        })

        pendingReportItems.forEach(item => {
            quickActionsQueue.push({
                id: item.id,
                type: "REPORT",
                title: `Laporan Memory: ${item.memory?.title ?? "Memory Terhapus"}`,
                description: `Dilaporkan oleh ${item.reporter.name} (Alasan: ${item.reason})`,
                createdAt: item.createdAt,
                href: "/admin/reports"
            })
        })

        pendingFeedbackItems.forEach(item => {
            const shortMsg = item.message.length > 45 ? `${item.message.substring(0, 45)}...` : item.message
            quickActionsQueue.push({
                id: item.id,
                type: "FEEDBACK",
                title: `Feedback: "${shortMsg}"`,
                description: `Dari user ${item.user.name}`,
                createdAt: item.createdAt,
                href: "/admin/feedbacks"
            })
        })

        // Sort quickActionsQueue by oldest first so oldest actions are handled first
        quickActionsQueue.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        const responsePayload = {
            stats: {
                totalUsers,
                newUsersToday,
                newUsersThisWeek,
                pendingFeedback,
                pendingReports,
                pendingTopup,
                pendingPremium,
            },
            recentActivity,
            quickActionsQueue: quickActionsQueue.slice(0, 8), // cap at 8 items
            isFallback: false
        }

        // Cache successful stats payload for 30 seconds
        globalForStats.statsCache = {
            data: responsePayload,
            expiresAt: Date.now() + 30 * 1000
        }

        return NextResponse.json(responsePayload)
    } catch (error) {
        console.error("GET admin stats error:", error)
        // Return a graceful fallback payload instead of throwing 500 database pool error
        return NextResponse.json({
            stats: {
                totalUsers: 0,
                newUsersToday: 0,
                newUsersThisWeek: 0,
                pendingFeedback: 0,
                pendingReports: 0,
                pendingTopup: 0,
                pendingPremium: 0,
            },
            recentActivity: [],
            quickActionsQueue: [],
            isFallback: true,
            error: "Database pool busy"
        })
    }
}
