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
        const search = searchParams.get("search") || ""

        const users = await prisma.user.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { username: { contains: search, mode: "insensitive" } },
                ]
            } : {},
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
            take: 50,
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("GET admin users error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
