import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                actor: { select: { id: true, name: true, image: true } },
                memory: { select: { id: true, title: true } }
            },
            take: 20
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error("Notifications Fetch Error:", error)
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id, markAllAsRead } = await req.json()

        if (markAllAsRead) {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, isRead: false },
                data: { isRead: true }
            })
            return NextResponse.json({ message: "All notifications marked as read" })
        }

        if (!id) return NextResponse.json({ error: "Notification ID required" }, { status: 400 })

        const updated = await prisma.notification.update({
            where: { id, userId: session.user.id },
            data: { isRead: true }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Notifications Update Error:", error)
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id, deleteAll } = await req.json()

        if (deleteAll) {
            await prisma.notification.deleteMany({
                where: { userId: session.user.id }
            })
            return NextResponse.json({ message: "All notifications deleted" })
        }

        if (!id) return NextResponse.json({ error: "Notification ID required" }, { status: 400 })

        await prisma.notification.delete({
            where: { id, userId: session.user.id }
        })

        return NextResponse.json({ message: "Notification deleted" })
    } catch (error) {
        console.error("Notifications Delete Error:", error)
        return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
    }
}
