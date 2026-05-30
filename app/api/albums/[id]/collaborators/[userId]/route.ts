import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
    params: Promise<{ id: string; userId: string }>
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id, userId: targetUserId } = await params
        const userId = session.user.id

        // 1. Ambil data album dan kolaborator
        const album = await prisma.album.findUnique({
            where: { id },
            include: { collaborators: true }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        const isOwner = album.userId === userId
        const isSelfRemove = userId === targetUserId

        // 2. Validasi Hak Akses
        // Pemilik album boleh mendepak siapa saja.
        // Kolaborator boleh mengeluarkan diri mereka sendiri secara mandiri.
        if (!isOwner && !isSelfRemove) {
            return NextResponse.json({ error: "Anda tidak memiliki wewenang untuk mengeluarkan anggota dari album ini" }, { status: 403 })
        }

        // Cari data relasi kolaborator
        const collaborator = album.collaborators.find(c => c.userId === targetUserId)
        if (!collaborator) {
            return NextResponse.json({ error: "Kolaborator tidak terdaftar di dalam album ini" }, { status: 404 })
        }

        // 3. Eksekusi Penghapusan Relasi
        await prisma.albumCollaborator.delete({
            where: { id: collaborator.id }
        })

        // 4. Pemicu Notifikasi jika Keluar Mandiri (Self-Remove)
        if (isSelfRemove) {
            await prisma.notification.create({
                data: {
                    userId: album.userId, // Penerima notifikasi = Owner
                    actorId: userId,       // Pelaku aksi = Kolaborator yang keluar
                    albumId: id,
                    type: "ALBUM_LEAVE"
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: isSelfRemove
                ? "Anda berhasil keluar dari album kolaborasi"
                : "Kolaborator berhasil dikeluarkan dari album"
        })
    } catch (error) {
        console.error("Delete collaborator error:", error)
        return NextResponse.json({ error: "Gagal mengeluarkan kolaborator" }, { status: 500 })
    }
}
