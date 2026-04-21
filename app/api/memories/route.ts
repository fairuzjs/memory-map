import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memorySchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { getCachedPublicMemories } from "@/lib/services/memory-service"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

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
        const baseInclude: Prisma.MemoryInclude = {
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
            const ownMemoriesWhere: Prisma.MemoryWhereInput = { userId: currentUserId }
            if (emotion) ownMemoriesWhere.emotion = emotion as Prisma.EnumEmotionFilter

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

            // Terapkan pagination jika diminta
            const usePaginationMine = searchParams.has("page") || searchParams.has("limit")
            if (usePaginationMine) {
                const total  = combined.length
                const sliced = combined.slice((page - 1) * limit, page * limit)
                return NextResponse.json({
                    data: sliced,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasMore: page * limit < total,
                    }
                })
            }

            return NextResponse.json(combined)
        }

        const currentUserId = session?.user?.id
        const where: Prisma.MemoryWhereInput = {}

        if (emotion) where.emotion = emotion as Prisma.EnumEmotionFilter

        if (!userId) {
            // 1. Public Feed: tanpa userId dan tanpa mine. Wajib public-only!
            where.isPublic = true
        } else {
            // Fetch memory sendiri + memory kolaborasi
            const collabs = await prisma.memoryCollaborator.findMany({
                where: { userId: userId, status: "ACCEPTED" },
                select: { memoryId: true }
            })
            const collabIds = collabs.map(c => c.memoryId)

            where.OR = [
                { userId: userId },
                { id: { in: collabIds } }
            ]

            // Kalau visitor bukan owner, atau owner eksplisit minta publicOnly
            if (!currentUserId || userId !== currentUserId || publicOnly) {
                where.isPublic = true
            }
        }

        // Sorting
        const orderBy: Prisma.MemoryOrderByWithRelationInput | Prisma.MemoryOrderByWithRelationInput[] =
            sort === "popular"
                ? [
                    { reactions: { _count: "desc" } } as Prisma.MemoryOrderByWithRelationInput,
                    { comments:  { _count: "desc" } } as Prisma.MemoryOrderByWithRelationInput,
                ]
                : { createdAt: "desc" }

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

        // Optimized path for profile page public memories
        if (userId && publicOnly && !searchParams.has("page") && !searchParams.has("limit") && sort !== "popular") {
            const memories = await getCachedPublicMemories(userId)
            return NextResponse.json(memories)
        }

        // Backward-compatible: kembalikan array biasa
        const memories = await prisma.memory.findMany({
            where,
            include: baseInclude,
            orderBy,
        })
        return NextResponse.json(memories)
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error("GET memories error:", error)
        return NextResponse.json({ error: "Failed to fetch memories", details: msg }, { status: 500 })
    }
}


export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Blokir user yang belum verifikasi email
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isEmailVerified: true }
        })
        if (!currentUser || currentUser.isEmailVerified === false) {
            return NextResponse.json(
                { error: "EMAIL_NOT_VERIFIED", message: "Verifikasi email kamu terlebih dahulu sebelum membuat memory." },
                { status: 403 }
            )
        }

        const body = await req.json()
        const result = memorySchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: "Invalid data", details: result.error.flatten() }, { status: 400 })
        }

        const { photos, tags, date, collaborators, audio, ...data } = result.data

        // ── Premium feature gate: Spotify integration ──
        if (data.spotifyTrackId) {
            const hasSpotifyPremium = await prisma.userInventory.findFirst({
                where: {
                    userId: session.user.id,
                    item: { type: "PREMIUM_FEATURE", value: "spotify_integration" },
                },
            })
            if (!hasSpotifyPremium) {
                return NextResponse.json(
                    { error: "Fitur Spotify adalah fitur premium. Silakan beli di Memory Shop terlebih dahulu." },
                    { status: 403 }
                )
            }
        }

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
                    // Audio clip fields
                    ...(audio ? {
                        audioUrl: audio.url,
                        audioBucket: audio.bucket,
                        audioPath: audio.path,
                        audioStartTime: audio.startTime,
                        audioDuration: audio.duration,
                        audioFileName: audio.fileName,
                    } : {}),
                    // Spotify integration
                    spotifyTrackId: data.spotifyTrackId || null,
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

        // Revalidate cache for the user who created it
        ;(revalidateTag as any)(CACHE_TAGS.userMemories(session.user.id))
        // Also revalidate the user object because _count.memories changed
        ;(revalidateTag as any)(CACHE_TAGS.user(session.user.id))

        return NextResponse.json(memory, { status: 201 })
    } catch (error) {
        console.error("POST memory error:", error)
        return NextResponse.json({ error: "Failed to create memory" }, { status: 500 })
    }
}