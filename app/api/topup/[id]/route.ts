import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { adminOrderActionSchema } from "@/lib/validations"
import { createAdminAuditLog } from "@/lib/audit"

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
        const body = await req.json()
        const isAdmin = session.user.role === "ADMIN"

        let status = body.status
        let note = body.note

        // Admin bisa COMPLETED atau CANCELLED, user hanya bisa CANCELLED (batalkan sendiri)
        if (isAdmin) {
            const parsed = adminOrderActionSchema.safeParse(body)
            if (!parsed.success) {
                return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
            }
            status = parsed.data.status
            note = parsed.data.note
        } else {
            if (status !== "CANCELLED") {
                return NextResponse.json({ error: "User hanya bisa membatalkan pesanan" }, { status: 403 })
            }
        }

        const order = await prisma.topupOrder.findUnique({ where: { id } })
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

        // Hanya update status — penambahan poin dilakukan terpisah via halaman Proses Topup admin
        const result = await prisma.topupOrder.update({
            where: { id },
            data: {
                status,
                note: note?.trim() || (!isAdmin ? "Dibatalkan oleh pengguna" : null),
            },
            include: {
                user: { select: { id: true, name: true, email: true, points: true } },
            },
        })

        // Record audit trail
        if (isAdmin) {
            await createAdminAuditLog(
                session.user.id,
                status === "COMPLETED" ? "APPROVE_TOPUP" : "REJECT_TOPUP",
                "TOPUP_ORDER",
                id,
                { amount: order.amount, userId: order.userId, note }
            )
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("PATCH topup error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// GET — ambil satu order (untuk status check dari user)
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
        const order = await prisma.topupOrder.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        })

        if (!order) {
            return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 })
        }

        // User hanya bisa lihat order miliknya, admin bisa lihat semua
        if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error("GET topup [id] error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

