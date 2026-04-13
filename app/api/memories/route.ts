import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memorySchema } from "@/lib/validations"

export async function GET(req: Request) {
    try {
        const session = await auth()
        const { searchParams } = new URL(req.url)
        const emotion    = searchParams.get("emotion")
        const publicOnly = searchParams.get("public") === "true"
        const userId     = searchParams.get("userId")
        const mine       = searchParams.get("mine") === "true"
        const sort       = searchParams.get("sort") ?? "latest"   // "latest" | "popular"
        const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
        const limit      = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)))

        // Base object untuk include dan orderBy
        const baseInclude: any = {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    inventories: {
                        where: { isEquipped: true, item: { type: "MEMORY_CARD_THEME" } },
                        select: { item: { select: { value: true } } },
                        take: 1,
                    }
                }
            },
            photos: true,
            stickerPlacements: {
                include: {
                    item: { select: { id: true, name: true, value: true, previewColor: true } }
                },
                orderBy: { createdAt: "asc" as const }
            },
            _count: { select: { reactions: true, comments: true } }
        }

        // Mode "mine=true" — gabungkan memory sendiri + kolaborasi ACCEPTED
        if (mine) {
            if (!session?.user?.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
            }

            const currentUserId = session.user.id

            // Fetch memory milik user sendiri
            const ownMemoriesWhere: any = { userId: currentUserId }
            if (emotion) ownMemoriesWhere.emotion = emotion

            const ownMemories = await prisma.memory.findMany({
                where: ownMemoriesWhere,
                include: baseInclude,
                orderBy: { date: "desc" }
            })

            // Fetch memory kolaborasi (ACCEPTED)
            const collabEntries = await prisma.memoryCollaborator.findMany({
                where: { userId: currentUserId, status: "ACCEPTED" },
                include: {
                    memory: {
                        include: baseInclude
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

        const currentUserId = session?.user?.id
        const where: any = {}

        if (emotion) where.emotion = emotion

        if (!userId) {
            // 1. Public Feed: tanpa userId dan tanpa mine. Wajib public-only!
            where.isPublic = true
        } else if (!currentUserId) {
            // 2. Guest lihat profile user lain => public only
            where.userId = userId
            where.isPublic = true
        } else if (userId === currentUserId) {
            // 3. Owner profile => semua memory sendiri 
            // Cek jika client eksplisit hanya meminta public
            where.userId = userId
            if (publicOnly) where.isPublic = true
        } else {
            // 4. User login lihat profile user lain => public only
            where.userId = userId
            where.isPublic = true
        }

        // Sorting
        let orderBy: any
        if (sort === "popular") {
            orderBy = [
                { reactions: { _count: "desc" } },
                { comments:  { _count: "desc" } },
            ]
        } else {
            orderBy = { createdAt: "desc" }
        }

        // Hanya pakai pagination jika client eksplisit kirim ?page=
        const usePagination = searchParams.has("page") || searchParams.has("limit")

        if (usePagination) {
            const total = await prisma.memory.count({ where })
            const memories = await prisma.memory.findMany({
                where,
                include: baseInclude,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            })
            return NextResponse.json({
                data: memories,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page * limit < total,
                }
            })
        }

        // Backward-compatible: kembalikan array biasa
        const memories = await prisma.memory.findMany({
            where,
            include: baseInclude,
            orderBy,
        })
        return NextResponse.json(memories)
    } catch (error: any) {
        console.error("GET memories error:", error)
        return NextResponse.json({ error: "Failed to fetch memories", details: error.message || String(error) }, { status: 500 })
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

        const { photos, tags, date, collaborators, audio, ...data } = result.data

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
                    },
                    // Audio clip data
                    ...(audio ? {
                        audioUrl: audio.url,
                        audioBucket: audio.bucket,
                        audioPath: audio.path,
                        audioStartTime: audio.startTime,
                        audioDuration: audio.duration,
                        audioFileName: audio.fileName,
                    } : {}),
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