import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client" // Tambahkan import ini

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { content, parentId } = await req.json()
        if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 })

        const comment = await prisma.comment.create({
            data: {
                content,
                userId: session.user.id,
                memoryId: id,
                parentId: parentId || null
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
                memory: { select: { userId: true, title: true } },
                parent: { select: { userId: true } }
            }
        })

        // Notify memory owner
        if (comment.memory.userId !== session.user.id) {
            await prisma.notification.create({
                data: {
                    type: NotificationType.COMMENT, // Gunakan Enum
                    userId: comment.memory.userId,
                    actorId: session.user.id,
                    memoryId: id
                }
            })
        }

        // Notify parent comment owner if it's a reply
        if (comment.parentId && comment.parent && 
            comment.parent.userId !== session.user.id && 
            comment.parent.userId !== comment.memory.userId) {
            
            await prisma.notification.create({
                data: {
                    type: NotificationType.REPLY, // Gunakan Enum
                    userId: comment.parent.userId,
                    actorId: session.user.id,
                    memoryId: id
                }
            })
        }

        return NextResponse.json(comment, { status: 201 })
    } catch (error) {
        console.error("Comment Error:", error)
        return NextResponse.json({ error: "Failed to post comment" }, { status: 500 })
    }
}
