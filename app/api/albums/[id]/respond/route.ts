import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const userId = session.user.id
        const body = await req.json()
        const { action } = body // action can be "ACCEPT" or "DECLINE"

        if (action !== "ACCEPT" && action !== "DECLINE") {
            return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 })
        }

        // 1. Cari kolaborator berstatus PENDING
        const collaborator = await prisma.albumCollaborator.findUnique({
            where: {
                albumId_userId: {
                    albumId: id,
                    userId
                }
            }
        })

        if (!collaborator || collaborator.status !== "PENDING") {
            return NextResponse.json({ error: "Undangan kolaborasi tidak ditemukan atau sudah diproses" }, { status: 404 })
        }

        // 2. Proses Aksi
        if (action === "ACCEPT") {
            const updated = await prisma.albumCollaborator.update({
                where: { id: collaborator.id },
                data: { status: "ACCEPTED" }
            })

            // Tandai notifikasi terkait sebagai terbaca
            await prisma.notification.updateMany({
                where: {
                    userId,
                    albumId: id,
                    type: "ALBUM_INVITE"
                },
                data: { isRead: true }
            })

            return NextResponse.json(updated)
        } else {
            // Jika ditolak, ubah status ke DECLINED
            const updated = await prisma.albumCollaborator.update({
                where: { id: collaborator.id },
                data: { status: "DECLINED" }
            })

            // Hapus atau tandai terbaca notifikasi terkait
            await prisma.notification.deleteMany({
                where: {
                    userId,
                    albumId: id,
                    type: "ALBUM_INVITE"
                }
            })

            return NextResponse.json({ success: true, message: "Undangan berhasil ditolak" })
        }
    } catch (error) {
        console.error("Respond invitation error:", error)
        return NextResponse.json({ error: "Gagal memproses undangan" }, { status: 500 })
    }
}
