import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memorySchema } from "@/lib/validations"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const emotion = searchParams.get("emotion")
        const publicOnly = searchParams.get("public") === "true"
        const userId = searchParams.get("userId")

        const where: any = {}
        if (emotion) where.emotion = emotion
        if (publicOnly) where.isPublic = true
        if (userId) where.userId = userId

        const memories = await prisma.memory.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, image: true } },
                photos: true,
                _count: { select: { reactions: true, comments: true } }
            },
            orderBy: { date: "desc" }
        })

        return NextResponse.json(memories)
    } catch (error) {
        console.error("GET memories error:", error)
        return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const result = memorySchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: "Invalid data", details: result.error.flatten() }, { status: 400 })
        }

        const { photos, tags, date, ...data } = result.data

        const memory = await prisma.memory.create({
            data: {
                ...data,
                date: new Date(date),
                userId: session.user.id,
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
            include: {
                photos: true,
                tags: true,
            }
        })

        return NextResponse.json(memory, { status: 201 })
    } catch (error) {
        console.error("POST memory error:", error)
        return NextResponse.json({ error: "Failed to create memory" }, { status: 500 })
    }
}
