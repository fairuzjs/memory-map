import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const { isVerified } = await req.json()

        const user = await prisma.user.update({
            where: { id },
            data: { isVerified: Boolean(isVerified) },
            select: { id: true, name: true, username: true, isVerified: true },
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("PATCH verify user error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
