import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

import { reactionSchema } from "@/lib/validations"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // 1. Validasi Input (Hardening)
        const body = await req.json()
        const result = reactionSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json({ error: "Invalid reaction type", details: result.error.format() }, { status: 400 })
        }
        const { type } = result.data

        // 2. Cek Eksistensi Memori (Data Consistency)
        const memory = await prisma.memory.findUnique({
            where: { id },
            select: { id: true, userId: true }
        })
        if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 })

        // 3. Rate Limit — 60 reactions per jam per user
        const rl = checkRateLimit(`reaction:${session.user.id}`, RATE_LIMITS.REACTION.limit, RATE_LIMITS.REACTION.windowMs)
        if (!rl.success) return rateLimitResponse(rl.reset)


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
