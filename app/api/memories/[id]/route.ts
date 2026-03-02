import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memorySchema } from "@/lib/validations"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const memory = await prisma.memory.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, image: true, bio: true } },
                photos: true,
                tags: true,
                comments: {
                    include: {
                        user: { select: { id: true, name: true, image: true } },
                        replies: { include: { user: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: "asc" } }
                    },
                    where: { parentId: null },
                    orderBy: { createdAt: "asc" }
                },
                reactions: {
                    include: { user: { select: { id: true, name: true } } }
                },
                _count: { select: { reactions: true } }
            }
        })

        if (!memory) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 })
        }

        return NextResponse.json(memory)
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const memory = await prisma.memory.findUnique({ where: { id } })
        if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 })
        if (memory.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        const body = await req.json()
        const result = memorySchema.safeParse(body)
        if (!result.success) return NextResponse.json({ error: "Invalid data", details: result.error.flatten() }, { status: 400 })

        const { photos, tags, date, ...data } = result.data

        await prisma.photo.deleteMany({ where: { memoryId: id } })

        const updated = await prisma.memory.update({
            where: { id },
            data: {
                ...data,
                date: new Date(date),
                photos: {
                    create: photos?.map(url => ({ url })) || []
                },
                tags: {
                    connectOrCreate: tags?.map(tag => ({
                        where: { name: tag },
                        create: { name: tag }
                    })) || []
                }
            },
            include: { photos: true, tags: true }
        })

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const memory = await prisma.memory.findUnique({ where: { id } })
        if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 })
        const isAdmin = session.user.role === "ADMIN"
        if (memory.userId !== session.user.id && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        await prisma.memory.delete({ where: { id } })

        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 })
    }
}
