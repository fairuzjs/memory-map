import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const q = searchParams.get("q")?.trim()

        if (!q || q.length < 2) {
            return NextResponse.json([])
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    // Jangan tampilkan user yang sedang login
                    { id: { not: session.user.id } },
                    {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { email: { contains: q, mode: "insensitive" } },
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                image: true,
                email: true,
            },
            take: 8,
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error("Search users error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
