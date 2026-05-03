import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PREMIUM_CONFIG, isPremiumActive } from "@/lib/premium-config"

// PATCH — admin approve/reject premium order, atau user cancel sendiri
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const { status, note } = await req.json()
        const isAdmin = session.user.role === "ADMIN"

        // Admin bisa COMPLETED atau CANCELLED, user hanya bisa CANCELLED
        if (isAdmin) {
            if (!["COMPLETED", "CANCELLED"].includes(status)) {
                return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
            }
        } else {
            if (status !== "CANCELLED") {
                return NextResponse.json({ error: "User hanya bisa membatalkan pesanan" }, { status: 403 })
            }
        }

        const order = await prisma.premiumOrder.findUnique({ where: { id } })
        if (!order) {
            return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
        }

        // User hanya bisa batalkan order miliknya sendiri
        if (!isAdmin && order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        if (order.status !== "PENDING") {
            return NextResponse.json({ error: "Order sudah diproses sebelumnya" }, { status: 409 })
        }

        // Jika admin APPROVE → aktifkan premium + beri bonus 250 poin
        if (isAdmin && status === "COMPLETED") {
            const user = await prisma.user.findUnique({
                where: { id: order.userId },
                select: { isPremium: true, premiumExpiresAt: true },
            })

            // Hitung tanggal expired baru
            // Jika masih premium aktif, perpanjang dari tanggal expired saat ini
            // Jika sudah expired, mulai dari sekarang
            let startDate = new Date()
            if (user?.premiumExpiresAt && isPremiumActive(user.premiumExpiresAt)) {
                startDate = new Date(user.premiumExpiresAt)
            }
            const newExpiresAt = new Date(startDate.getTime() + order.durationDays * 24 * 60 * 60 * 1000)

            // Cek apakah ini pertama kali jadi premium (untuk bonus upgrade)
            const isFirstTime = !user?.isPremium
            const upgradeBonus = isFirstTime ? PREMIUM_CONFIG.premium.upgradeBonus : 0

            await prisma.$transaction([
                // Update order status
                prisma.premiumOrder.update({
                    where: { id },
                    data: { status: "COMPLETED", note: note?.trim() || null },
                }),
                // Aktifkan premium + perpanjang expired + beri bonus poin
                prisma.user.update({
                    where: { id: order.userId },
                    data: {
                        isPremium: true,
                        premiumExpiresAt: newExpiresAt,
                        ...(upgradeBonus > 0 ? { points: { increment: upgradeBonus } } : {}),
                    },
                }),
            ])

            // ── Create notification for user (instead of auto-granting items) ──
            // Items will be claimed manually by the user via /api/premium/claim
            await prisma.$transaction([
                // Reset claim flag so user can claim items
                prisma.user.update({
                    where: { id: order.userId },
                    data: { premiumItemsClaimed: false },
                }),
                // Create notification
                prisma.notification.create({
                    data: {
                        type: "PREMIUM_ACTIVATED",
                        userId: order.userId,
                        actorId: session.user.id, // admin who approved
                    },
                }),
            ])

            return NextResponse.json({
                success: true,
                premiumExpiresAt: newExpiresAt,
                upgradeBonus,
                message: upgradeBonus > 0
                    ? `Premium diaktifkan! User mendapat bonus ${upgradeBonus} poin.`
                    : `Premium diperpanjang sampai ${newExpiresAt.toLocaleDateString("id-ID")}.`,
            })
        }

        // Cancel order
        const result = await prisma.premiumOrder.update({
            where: { id },
            data: {
                status,
                note: note?.trim() || (!isAdmin ? "Dibatalkan oleh pengguna" : null),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("PATCH premium order error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// GET — ambil satu order (untuk status check)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const order = await prisma.premiumOrder.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, isPremium: true, premiumExpiresAt: true } },
            },
        })

        if (!order) {
            return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
        }

        if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error("GET premium [id] error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
