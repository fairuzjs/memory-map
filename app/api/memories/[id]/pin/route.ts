import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id
        
        const memory = await prisma.memory.findUnique({ 
            where: { id },
            include: { collaborators: true }
        })
        if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 })
        
        const isOwner = memory.userId === userId
        const isCollaborator = memory.collaborators.some(c => c.userId === userId && c.status === "ACCEPTED")

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Kamu tidak memiliki akses untuk menyematkan kenangan ini" }, { status: 403 })
        }

        const invalidateCaches = () => {
            ;(revalidateTag as any)(CACHE_TAGS.userMemories(memory.userId))
            memory.collaborators.forEach(c => {
                if (c.status === "ACCEPTED") {
                    ;(revalidateTag as any)(CACHE_TAGS.userMemories(c.userId))
                }
            })
        }

        if (memory.isPinned) {
            // Unpin
            const updated = await prisma.memory.update({
                where: { id },
                data: { isPinned: false }
            })
            invalidateCaches()
            return NextResponse.json({ isPinned: false, message: "Kenangan batal disematkan" })
        } else {
            // Pin
            const pinnedCount = await prisma.memory.count({
                where: {
                    OR: [
                        { userId },
                        { collaborators: { some: { userId, status: "ACCEPTED" } } }
                    ],
                    isPinned: true
                }
            })

            if (pinnedCount >= 3) {
                return NextResponse.json({ error: "Maksimal 3 kenangan yang bisa disematkan" }, { status: 400 })
            }

            const updated = await prisma.memory.update({
                where: { id },
                data: { isPinned: true }
            })
            invalidateCaches()
            return NextResponse.json({ isPinned: true, message: "Kenangan berhasil disematkan" })
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
