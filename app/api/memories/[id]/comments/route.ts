import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
                user: { select: { id: true, name: true, image: true } }
            }
        })

        return NextResponse.json(comment, { status: 201 })
    } catch (error) {
        console.error("Comment Error:", error)
        return NextResponse.json({ error: "Failed to post comment" }, { status: 500 })
    }
}
