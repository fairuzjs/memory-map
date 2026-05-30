import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const userId = session.user.id

        // 1. Ambil album beserta kolaborator untuk validasi akses
        const album = await prisma.album.findUnique({
            where: { id },
            include: {
                collaborators: {
                    where: { status: "ACCEPTED" }
                }
            }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        const isOwner = album.userId === userId
        const isCollaborator = album.collaborators.some(c => c.userId === userId)

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke album ini" }, { status: 403 })
        }

        // 2. Ambil maksimal 10 catatan tempel terbaru
        const notes = await prisma.albumStickyNote.findMany({
            where: { albumId: id },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        })

        // Kembalikan catatan dengan urutan kronologis terlama -> terbaru agar rapi saat dirender
        return NextResponse.json(notes.reverse())
    } catch (error) {
        console.error("GET sticky notes error:", error)
        return NextResponse.json({ error: "Gagal memuat catatan tempel" }, { status: 500 })
    }
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
        const { content } = body

        if (!content || typeof content !== "string" || content.trim() === "") {
            return NextResponse.json({ error: "Konten catatan wajib diisi" }, { status: 400 })
        }

        const cleanContent = content.trim()
        if (cleanContent.length > 100) {
            return NextResponse.json({ error: "Catatan maksimal 100 karakter" }, { status: 400 })
        }

        // 1. Validasi keanggotaan album
        const album = await prisma.album.findUnique({
            where: { id },
            include: {
                collaborators: {
                    where: { status: "ACCEPTED" }
                }
            }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        const isOwner = album.userId === userId
        const isCollaborator = album.collaborators.some(c => c.userId === userId)

        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Anda tidak memiliki akses untuk menambah catatan" }, { status: 403 })
        }

        // 2. Validasi Batas Maksimum 10 Catatan Tempel (Specification 1)
        const notesCount = await prisma.albumStickyNote.count({
            where: { albumId: id }
        })

        if (notesCount >= 10) {
            return NextResponse.json({ error: "Batas maksimal 10 catatan tempel telah tercapai" }, { status: 400 })
        }

        // 3. Tentukan warna neubrutalist dan kemiringan visual secara acak
        const colors = ["yellow", "pink", "cyan", "orange"]
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        // Kemiringan acak -3, -2, -1, 1, 2, 3 (menghindari 0 agar terasa lebih scrap-book)
        const possibleRotations = [-3, -2, -1, 1, 2, 3]
        const rotation = possibleRotations[Math.floor(Math.random() * possibleRotations.length)]

        // 4. Simpan catatan tempel baru
        const newNote = await prisma.albumStickyNote.create({
            data: {
                content: cleanContent,
                color,
                rotation,
                userId,
                albumId: id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        })

        return NextResponse.json(newNote, { status: 201 })
    } catch (error) {
        console.error("POST sticky note error:", error)
        return NextResponse.json({ error: "Gagal membuat catatan tempel" }, { status: 500 })
    }
}
