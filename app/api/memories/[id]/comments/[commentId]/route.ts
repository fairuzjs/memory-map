import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, commentId: string }> }) {
    try {
        const { id, commentId } = await params;
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        })

        if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })

        // Check if user is comment owner or memory owner
        const memory = await prisma.memory.findUnique({ where: { id: id } })
        if (comment.userId !== session.user.id && memory?.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.comment.delete({ where: { id: commentId } })

        return NextResponse.json({ message: "Deleted" })
    } catch (error) {
        console.error("Delete Comment Error:", error)
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
    }
}
