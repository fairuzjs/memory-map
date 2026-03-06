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
        const mine = searchParams.get("mine") === "true"

        // Mode "mine=true" — gabungkan memory sendiri + kolaborasi ACCEPTED
        if (mine) {
            const session = await auth()
            if (!session?.user?.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
            }

            const currentUserId = session.user.id

            // Fetch memory milik user sendiri
            const ownMemoriesWhere: any = { userId: currentUserId }
            if (emotion) ownMemoriesWhere.emotion = emotion

            const ownMemories = await prisma.memory.findMany({
                where: ownMemoriesWhere,
                include: {
                    user: { select: { id: true, name: true, image: true } },
                    photos: true,
                    _count: { select: { reactions: true, comments: true } }
                },
                orderBy: { date: "desc" }
            })

            // Fetch memory kolaborasi (ACCEPTED)
            const collabEntries = await prisma.memoryCollaborator.findMany({
                where: { userId: currentUserId, status: "ACCEPTED" },
                include: {
                    memory: {
                        include: {
                            user: { select: { id: true, name: true, image: true } },
                            photos: true,
                            _count: { select: { reactions: true, comments: true } }
                        }
                    }
                }
            })

            // Tandai kolaborasi agar bisa dibedakan di UI
            const collabMemories = collabEntries
                .map(entry => ({ ...entry.memory, isCollaboration: true }))
                .filter(m => !emotion || m.emotion === emotion)

            // Gabungkan & urutkan berdasarkan date
            const combined = [
                ...ownMemories.map(m => ({ ...m, isCollaboration: false })),
                ...collabMemories
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            return NextResponse.json(combined)
        }

        // Mode default (public feed, profile, dll)
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

        const { photos, tags, date, collaborators, ...data } = result.data

        // Buat memory dalam transaction sekaligus dengan collaborators + notifikasi
        const memory = await prisma.$transaction(async (tx) => {
            const newMemory = await tx.memory.create({
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

            // Buat undangan kolaborasi untuk setiap collaborator
            if (collaborators && collaborators.length > 0) {
                // Filter duplikat dan diri sendiri
                const uniqueCollabs = [...new Set(collaborators)].filter(
                    (uid) => uid !== session.user.id
                )

                for (const userId of uniqueCollabs) {
                    await tx.memoryCollaborator.create({
                        data: {
                            memoryId: newMemory.id,
                            userId,
                            status: "PENDING",
                        }
                    })

                    await tx.notification.create({
                        data: {
                            type: "COLLABORATION_INVITE",
                            userId,
                            actorId: session.user.id,
                            memoryId: newMemory.id,
                        }
                    })
                }
            }

            return newMemory
        })

        return NextResponse.json(memory, { status: 201 })
    } catch (error) {
        console.error("POST memory error:", error)
        return NextResponse.json({ error: "Failed to create memory" }, { status: 500 })
    }
}

