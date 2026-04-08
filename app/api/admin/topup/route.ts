import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const TOPUP_OPTIONS = [
    { amount: 500, price: 5000 },
    { amount: 1000, price: 10000 },
    { amount: 2500, price: 25000 },
    { amount: 5000, price: 50000 },
    { amount: 10000, price: 100000 },
    { amount: 25000, price: 250000 },
]

// POST — admin langsung menambah poin ke user (tanpa order)
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { emailOrName, amount } = await req.json()

        if (!emailOrName?.trim()) {
            return NextResponse.json({ error: "Email atau nama diperlukan" }, { status: 400 })
        }

        const option = TOPUP_OPTIONS.find((o) => o.amount === amount)
        if (!option) {
            return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 })
        }

        // Cari user berdasarkan email (prioritas) atau nama
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: { contains: emailOrName.trim(), mode: "insensitive" } },
                    { name: { contains: emailOrName.trim(), mode: "insensitive" } },
                ],
            },
            select: { id: true, name: true, email: true, image: true, points: true },
        })

        if (!targetUser) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
        }

        // Buat order + tambah point dalam satu transaksi
        const [order, updatedUser] = await prisma.$transaction([
            prisma.topupOrder.create({
                data: {
                    userId: targetUser.id,
                    amount: option.amount,
                    price: option.price,
                    status: "COMPLETED",
                    note: `Ditambahkan langsung oleh admin (${session.user.name ?? session.user.email})`,
                },
            }),
            prisma.user.update({
                where: { id: targetUser.id },
                data: { points: { increment: option.amount } },
                select: { id: true, name: true, email: true, points: true },
            }),
        ])

        return NextResponse.json({ order, user: updatedUser }, { status: 201 })
    } catch (error) {
        console.error("POST admin/topup error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// GET — cari user untuk preview sebelum topup
export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const q = searchParams.get("q")?.trim()

        if (!q || q.length < 2) {
            return NextResponse.json([])
        }

        const users = await prisma.user.findMany({
            where: {
                role: "USER",
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                ],
            },
            select: { id: true, name: true, email: true, image: true, points: true },
            take: 8,
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("GET admin/topup search error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
