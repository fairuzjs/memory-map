import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/users/by-username/[username]
// Returns { id } of the user with this username for redirect
export async function GET(
    req: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params

        const user = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: { id: true },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ id: user.id })
    } catch (error) {
        console.error("GET by-username error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
