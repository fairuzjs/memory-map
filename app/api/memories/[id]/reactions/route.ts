import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Rate Limit — 60 reactions per jam per user
        const rl = checkRateLimit(`reaction:${session.user.id}`, RATE_LIMITS.REACTION.limit, RATE_LIMITS.REACTION.windowMs)
        if (!rl.success) return rateLimitResponse(rl.reset)

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

        // Notify memory owner
        const memory = await prisma.memory.findUnique({
            where: { id: memoryId },
            select: { userId: true }
        })

        if (memory && memory.userId !== userId) {
            await prisma.notification.create({
                data: {
                    type: "REACTION",
                    userId: memory.userId,
                    actorId: userId,
                    memoryId: memoryId
                }
            })
        }

        return NextResponse.json({ message: "Reaction added", action: "added", reaction })
    } catch (error) {
        console.error("Reaction Error:", error)
        return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 })
    }
}
