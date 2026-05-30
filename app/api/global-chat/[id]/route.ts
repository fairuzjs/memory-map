import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { captureError, captureInteraction } from "@/lib/monitoring"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        
        const message = await prisma.globalChatMessage.findUnique({
            where: { id }
        })

        if (!message || message.isDeleted) {
            return NextResponse.json({ error: "Pesan tidak ditemukan" }, { status: 404 })
        }

        // Check if user is admin via their session role or explicitly fetch user
        // Assuming session.user.role is populated by NextAuth callbacks
        const isAdmin = session.user.role === "ADMIN"
        const isOwner = message.userId === session.user.id

        if (!isAdmin && !isOwner) {
            // Re-check role from db if session role is missing (fallback)
            const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
            if (dbUser?.role !== "ADMIN") {
                return NextResponse.json({ error: "Anda tidak memiliki akses untuk menghapus pesan ini" }, { status: 403 })
            }
        }

        const actuallyAdmin = isAdmin || (await prisma.user.findUnique({ where: { id: session.user.id } }))?.role === "ADMIN"

        await prisma.globalChatMessage.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: session.user.id
            }
        })

        if (actuallyAdmin && !isOwner) {
            captureInteraction("Admin Deleted Global Chat Message", {
                adminId: session.user.id,
                messageId: id,
                messageOwnerId: message.userId
            })
            
            // Log for admin actions
            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    action: "DELETE_GLOBAL_CHAT",
                    targetType: "GlobalChatMessage",
                    targetId: id,
                    metadata: JSON.stringify({ reason: "Moderation" })
                }
            })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        captureError(error, { route: "DELETE /api/global-chat/[id]" })
        return NextResponse.json({ error: "Gagal menghapus obrolan" }, { status: 500 })
    }
}
