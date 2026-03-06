import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_COLLABORATORS = 5

// GET /api/memories/[id]/collaborators — ambil daftar kolaborator
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: memoryId } = await params

        const collaborators = await prisma.memoryCollaborator.findMany({
            where: { memoryId },
            include: {
                user: { select: { id: true, name: true, image: true } }
            },
            orderBy: { createdAt: "asc" }
        })

        return NextResponse.json(collaborators)
    } catch (error) {
        console.error("GET collaborators error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// POST /api/memories/[id]/collaborators — kirim undangan (hanya pemilik memory)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: memoryId } = await params
        const { userId } = await req.json()

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 })
        }

        // Pastikan memory ada dan milik user yang sedang login
        const memory = await prisma.memory.findUnique({
            where: { id: memoryId },
            select: { userId: true }
        })

        if (!memory) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 })
        }

        if (memory.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Tidak bisa mengundang diri sendiri
        if (userId === session.user.id) {
            return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 })
        }

        // Cek batas maksimal kolaborator (hitung yang ACCEPTED + PENDING)
        const existingCount = await prisma.memoryCollaborator.count({
            where: {
                memoryId,
                status: { in: ["ACCEPTED", "PENDING"] }
            }
        })

        if (existingCount >= MAX_COLLABORATORS) {
            return NextResponse.json(
                { error: `Maximum ${MAX_COLLABORATORS} collaborators allowed` },
                { status: 400 }
            )
        }

        // Cek apakah sudah diundang sebelumnya
        const existing = await prisma.memoryCollaborator.findUnique({
            where: { memoryId_userId: { memoryId, userId } }
        })

        if (existing) {
            return NextResponse.json({ error: "User already invited" }, { status: 409 })
        }

        // Buat kolaborator + kirim notifikasi dalam satu transaction
        const [collaborator] = await prisma.$transaction([
            prisma.memoryCollaborator.create({
                data: { memoryId, userId },
                include: {
                    user: { select: { id: true, name: true, image: true } }
                }
            }),
            prisma.notification.create({
                data: {
                    type: "COLLABORATION_INVITE",
                    userId,           // penerima notifikasi
                    actorId: session.user.id,  // pengirim undangan
                    memoryId,
                }
            })
        ])

        return NextResponse.json(collaborator, { status: 201 })
    } catch (error) {
        console.error("POST collaborator error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// DELETE /api/memories/[id]/collaborators — hapus kolaborator (hanya pemilik)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: memoryId } = await params
        const { userId } = await req.json()

        const memory = await prisma.memory.findUnique({
            where: { id: memoryId },
            select: { userId: true }
        })

        if (!memory) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 })
        }

        if (memory.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.memoryCollaborator.delete({
            where: { memoryId_userId: { memoryId, userId } }
        })

        return NextResponse.json({ message: "Collaborator removed" })
    } catch (error) {
        console.error("DELETE collaborator error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
