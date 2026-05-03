import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { PREMIUM_PRICING } from "@/lib/premium-config"

// POST — user membuat order premium
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Cek apakah user sudah punya order PENDING
        const existingPending = await prisma.premiumOrder.findFirst({
            where: { userId: session.user.id, status: "PENDING" },
        })
        if (existingPending) {
            return NextResponse.json(
                { error: "Kamu sudah memiliki pesanan premium yang menunggu verifikasi. Silakan tunggu atau batalkan pesanan sebelumnya." },
                { status: 409 }
            )
        }

        const body = await req.json()
        const proofImage = body.proofImage ?? null

        const order = await prisma.premiumOrder.create({
            data: {
                userId: session.user.id,
                durationDays: PREMIUM_PRICING.durationDays,
                price: PREMIUM_PRICING.price,
                status: "PENDING",
                proofImage,
            },
        })

        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        console.error("POST premium purchase error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// GET — user melihat order premium miliknya / admin melihat semua
export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")
        const page = parseInt(searchParams.get("page") ?? "1")
        const limit = parseInt(searchParams.get("limit") ?? "20")
        const skip = (page - 1) * limit
        const search = searchParams.get("search")

        const isAdmin = session.user.role === "ADMIN"

        const where: Record<string, unknown> = isAdmin
            ? status ? { status } : {}
            : { userId: session.user.id, ...(status ? { status } : {}) }

        if (search) {
            where.id = { contains: search }
        }

        const [orders, total] = await Promise.all([
            prisma.premiumOrder.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, image: true, isPremium: true, premiumExpiresAt: true },
                    },
                },
            }),
            prisma.premiumOrder.count({ where }),
        ])

        return NextResponse.json({ orders, total, page, limit })
    } catch (error) {
        console.error("GET premium orders error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
