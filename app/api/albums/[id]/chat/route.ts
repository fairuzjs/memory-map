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

        // 1. Ambil album untuk memvalidasi akses keanggotaan
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
            return NextResponse.json({ error: "Anda tidak memiliki akses ke obrolan album ini" }, { status: 403 })
        }

        // 2. Ambil 50 pesan obrolan terbaru
        const messages = await prisma.albumChatMessage.findMany({
            where: { albumId: id },
            orderBy: { createdAt: "desc" },
            take: 50,
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

        // Urutkan terlama -> terbaru untuk mempermudah render visual balon chat
        return NextResponse.json(messages.reverse())
    } catch (error) {
        console.error("GET album chat error:", error)
        return NextResponse.json({ error: "Gagal memuat obrolan" }, { status: 500 })
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
            return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 })
        }

        const cleanContent = content.trim()
        if (cleanContent.length > 500) {
            return NextResponse.json({ error: "Pesan maksimal 500 karakter" }, { status: 400 })
        }

        // 1. Validasi akses keanggotaan
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
            return NextResponse.json({ error: "Anda tidak memiliki akses untuk mengirim pesan" }, { status: 403 })
        }

        // 2. Buat pesan obrolan baru
        const newMessage = await prisma.albumChatMessage.create({
            data: {
                content: cleanContent,
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

        return NextResponse.json(newMessage, { status: 201 })
    } catch (error) {
        console.error("POST album chat error:", error)
        return NextResponse.json({ error: "Gagal mengirim obrolan" }, { status: 500 })
    }
}
