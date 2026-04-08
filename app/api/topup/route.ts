import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Daftar nominal topup yang valid
export const TOPUP_OPTIONS: { amount: number; price: number }[] = [
    { amount: 500, price: 5000 },
    { amount: 1000, price: 10000 },
    { amount: 2500, price: 25000 },
    { amount: 5000, price: 50000 },
    { amount: 10000, price: 100000 },
    { amount: 25000, price: 250000 },
]

// POST — user membuat order topup
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { amount } = await req.json()

        const option = TOPUP_OPTIONS.find((o) => o.amount === amount)
        if (!option) {
            return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 })
        }

        const order = await prisma.topupOrder.create({
            data: {
                userId: session.user.id,
                amount: option.amount,
                price: option.price,
                status: "PENDING",
            },
        })

        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        console.error("POST topup error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// GET — admin melihat semua order / user melihat order miliknya
export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") // PENDING | COMPLETED | CANCELLED | null
        const page = parseInt(searchParams.get("page") ?? "1")
        const limit = parseInt(searchParams.get("limit") ?? "20")
        const skip = (page - 1) * limit

        const isAdmin = session.user.role === "ADMIN"

        // Filter: admin bisa lihat semua, user hanya miliknya
        const where: Record<string, unknown> = isAdmin
            ? status ? { status } : {}
            : { userId: session.user.id, ...(status ? { status } : {}) }

        const [orders, total] = await Promise.all([
            prisma.topupOrder.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, image: true, points: true },
                    },
                },
            }),
            prisma.topupOrder.count({ where }),
        ])

        return NextResponse.json({ orders, total, page, limit })
    } catch (error) {
        console.error("GET topup error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
