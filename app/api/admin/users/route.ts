import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") ?? "1")
        const limit = parseInt(searchParams.get("limit") ?? "15")
        const skip = (page - 1) * limit
        const search = searchParams.get("search") || ""
        const role = searchParams.get("role") || "" // ADMIN | USER
        const isVerifiedStr = searchParams.get("isVerified") || "" // true | false

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
            ]
        }

        if (role && ["ADMIN", "USER"].includes(role)) {
            where.role = role
        }

        if (isVerifiedStr === "true") {
            where.isVerified = true
        } else if (isVerifiedStr === "false") {
            where.isVerified = false
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                    image: true,
                    isVerified: true,
                    role: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ])

        return NextResponse.json({ users, total, page, limit })
    } catch (error) {
        console.error("GET admin users error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

