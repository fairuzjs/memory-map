import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
    params: Promise<{ id: string; noteId: string }>
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: albumId, noteId } = await params
        const userId = session.user.id

        // 1. Cari catatan tempel
        const note = await prisma.albumStickyNote.findUnique({
            where: { id: noteId }
        })

        if (!note) {
            return NextResponse.json({ error: "Catatan tempel tidak ditemukan" }, { status: 404 })
        }

        // 2. Ambil data album untuk memvalidasi kepemilikan album
        const album = await prisma.album.findUnique({
            where: { id: albumId }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        // 3. Validasi Otorisasi Hapus (Specification 2)
        // Hanya Owner album atau Pembuat catatan itu sendiri yang boleh menghapus
        const isAlbumOwner = album.userId === userId
        const isNoteCreator = note.userId === userId

        if (!isAlbumOwner && !isNoteCreator) {
            return NextResponse.json(
                { error: "Anda tidak memiliki wewenang untuk menghapus catatan tempel ini" },
                { status: 403 }
            )
        }

        // 4. Hapus catatan tempel
        await prisma.albumStickyNote.delete({
            where: { id: noteId }
        })

        return NextResponse.json({ message: "Catatan tempel berhasil dihapus" })
    } catch (error) {
        console.error("DELETE sticky note error:", error)
        return NextResponse.json({ error: "Gagal menghapus catatan tempel" }, { status: 500 })
    }
}
