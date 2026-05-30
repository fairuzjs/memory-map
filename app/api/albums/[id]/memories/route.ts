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
        const { memoryId } = body

        if (!memoryId || typeof memoryId !== "string") {
            return NextResponse.json({ error: "ID Memori wajib disertakan" }, { status: 400 })
        }

        // 1. Ambil data album dan kolaborator
        const album = await prisma.album.findUnique({
            where: { id },
            include: { collaborators: true }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        const isOwner = album.userId === userId
        const isAcceptedCollab = album.collaborators.some(c => c.userId === userId && c.status === "ACCEPTED")

        if (!isOwner && !isAcceptedCollab) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke album ini" }, { status: 403 })
        }

        // 2. Ambil data memori dan validasi kepemilikan memori
        const memory = await prisma.memory.findUnique({
            where: { id: memoryId }
        })

        if (!memory) {
            return NextResponse.json({ error: "Memori tidak ditemukan" }, { status: 404 })
        }

        // Untuk keamanan mutlak MVP:
        // Editor dan Contributor hanya bisa menambahkan memori yang mereka miliki sendiri.
        // Owner bisa menambahkan memori miliknya sendiri.
        if (memory.userId !== userId) {
            return NextResponse.json({ error: "Anda hanya diperbolehkan menambahkan memori milik Anda sendiri ke album kolaborasi" }, { status: 403 })
        }

        // 3. Cek apakah memori sudah ada di dalam album ini
        const existingRelation = await prisma.albumMemory.findUnique({
            where: {
                albumId_memoryId: {
                    albumId: id,
                    memoryId
                }
            }
        })

        if (existingRelation) {
            return NextResponse.json({ error: "Memori sudah berada di dalam album ini" }, { status: 400 })
        }

        // 4. Tambahkan memori ke album
        const newRelation = await prisma.albumMemory.create({
            data: {
                albumId: id,
                memoryId
            }
        })

        return NextResponse.json(newRelation, { status: 201 })
    } catch (error) {
        console.error("Add memory to album error:", error)
        return NextResponse.json({ error: "Gagal menambahkan memori ke album" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const userId = session.user.id
        const { searchParams } = new URL(req.url)
        const memoryId = searchParams.get("memoryId")

        if (!memoryId) {
            return NextResponse.json({ error: "ID Memori wajib disertakan" }, { status: 400 })
        }

        // 1. Ambil data album dan kolaborator
        const album = await prisma.album.findUnique({
            where: { id },
            include: { collaborators: true }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        const isOwner = album.userId === userId
        const isAcceptedCollab = album.collaborators.some(c => c.userId === userId && c.status === "ACCEPTED")

        if (!isOwner && !isAcceptedCollab) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke album ini" }, { status: 403 })
        }

        // 2. Verifikasi otoritas penghapusan memori dari album:
        // - Owner: Bisa menghapus memori apa saja dari album miliknya.
        // - Editor: Bisa menghapus memori apa saja dari album kolaborasi.
        // - Contributor: Hanya bisa menghapus memori yang dia unggah/miliki sendiri.
        const memory = await prisma.memory.findUnique({
            where: { id: memoryId }
        })

        if (!memory) {
            return NextResponse.json({ error: "Memori tidak ditemukan" }, { status: 404 })
        }

        const isContributor = album.collaborators.some(c => c.userId === userId && c.role === "CONTRIBUTOR" && c.status === "ACCEPTED")

        if (isContributor && memory.userId !== userId && !isOwner) {
            return NextResponse.json({ error: "Sebagai Kontributor biasa, Anda hanya diperbolehkan mengeluarkan memori milik Anda sendiri" }, { status: 403 })
        }

        // 3. Hapus relasi memori dari album
        await prisma.albumMemory.delete({
            where: {
                albumId_memoryId: {
                    albumId: id,
                    memoryId
                }
            }
        })

        return NextResponse.json({ success: true, message: "Memori berhasil dikeluarkan dari album" })
    } catch (error) {
        console.error("Remove memory from album error:", error)
        return NextResponse.json({ error: "Gagal mengeluarkan memori dari album" }, { status: 500 })
    }
}
