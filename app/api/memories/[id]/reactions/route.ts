import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { type } = await req.json()
        if (!type) return NextResponse.json({ error: "Reaction type required" }, { status: 400 })

        const userId = session.user.id
        const memoryId = id

        // Check existing
        const existing = await prisma.reaction.findUnique({
            where: { userId_memoryId: { userId, memoryId } }
        })

        if (existing) {
            if (existing.type === type) {
                // Toggle off if same type
                await prisma.reaction.delete({ where: { id: existing.id } })
                return NextResponse.json({ message: "Reaction removed", action: "removed" })
            } else {
                // Update if different type
                const updated = await prisma.reaction.update({
                    where: { id: existing.id },
                    data: { type }
                })
                return NextResponse.json({ message: "Reaction updated", action: "updated", reaction: updated })
            }
        }

        // Create new
        const reaction = await prisma.reaction.create({
            data: { type, userId, memoryId }
        })

        return NextResponse.json({ message: "Reaction added", action: "added", reaction })
    } catch (error) {
        console.error("Reaction Error:", error)
        return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
    }
}
