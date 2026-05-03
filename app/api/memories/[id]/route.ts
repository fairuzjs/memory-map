import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { memorySchema } from "@/lib/validations"
import { isPremiumActive, getUserLimits } from "@/lib/premium-config"

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
                        user: { select: { id: true, name: true, image: true, premiumExpiresAt: true, isVerified: true } },
                        replies: { include: { user: { select: { id: true, name: true, image: true, premiumExpiresAt: true, isVerified: true } } }, orderBy: { createdAt: "asc" } }
                    },
                    where: { parentId: null },
                    orderBy: { createdAt: "asc" }
                },
                reactions: {
                    include: { user: { select: { id: true, name: true } } }
                },
                collaborators: {
                    where: { status: "ACCEPTED" },
                    include: { user: { select: { id: true, name: true, image: true } } },
                    orderBy: { createdAt: "asc" }
                },
                _count: { select: { reactions: true } }
            }
        })

        // Memory tidak ditemukan
        if (!memory) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 })
        }

        // ── Access Control ─────────────────────────────────────────────
        // Public memory → siapapun boleh akses (termasuk unauthenticated)
        if (memory.isPublic) {
            return NextResponse.json(memory)
        }

        // Private memory → wajib login
        const session = await auth()
        if (!session?.user?.id) {
            // Return 404, bukan 401/403 — agar tidak bocorkan eksistensi memory
            return NextResponse.json({ error: "Memory not found" }, { status: 404 })
        }

        const currentUserId = session.user.id

        // Admin bisa akses semua
        if (session.user.role === "ADMIN") {
            return NextResponse.json(memory)
        }

        // Owner bisa akses memorynya sendiri
        if (memory.userId === currentUserId) {
            return NextResponse.json(memory)
        }

        // Collaborator yang sudah ACCEPTED bisa akses
        const isCollaborator = memory.collaborators.some(
            (c) => c.user.id === currentUserId
        )
        if (isCollaborator) {
            return NextResponse.json(memory)
        }

        // Semua kondisi lain → 404 (jangan reveal eksistensi memory)
        return NextResponse.json({ error: "Memory not found" }, { status: 404 })

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

        // ── Determine premium limits ──
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { premiumExpiresAt: true }
        })
        const userIsPremium = isPremiumActive(currentUser?.premiumExpiresAt ?? null)
        const limits = getUserLimits(userIsPremium)

        const body = await req.json()
        const result = memorySchema.safeParse(body)
        if (!result.success) return NextResponse.json({ error: "Invalid data", details: result.error.flatten() }, { status: 400 })

        const { photos, tags, date, collaborators, audio, markerStyle, ...data } = result.data

        // ── Enforce dynamic photo limit ──
        if (photos && photos.length > limits.maxPhotos) {
            return NextResponse.json(
                { error: `Maksimal ${limits.maxPhotos} foto diperbolehkan. ${!userIsPremium ? "Upgrade ke Premium untuk upload hingga 10 foto!" : ""}` },
                { status: 400 }
            )
        }

        // ── Enforce dynamic collaborator limit ──
        const requestedCollabs = [...new Set(collaborators || [])].filter((uid: any) => uid !== session.user.id)
        if (requestedCollabs.length > limits.maxCollaborators) {
            return NextResponse.json(
                { error: `Maksimal ${limits.maxCollaborators} kolaborator diperbolehkan. ${!userIsPremium ? "Upgrade ke Premium untuk mengundang hingga 10 orang!" : ""}` },
                { status: 400 }
            )
        }

        // ── Premium feature gate: Spotify integration ──
        // Premium users get auto-unlock, free users need shop item
        if (data.spotifyTrackId && !userIsPremium) {
            const hasSpotifyPremium = await prisma.userInventory.findFirst({
                where: {
                    userId: session.user.id,
                    item: { type: "PREMIUM_FEATURE", value: "spotify_integration" },
                },
            })
            if (!hasSpotifyPremium) {
                return NextResponse.json(
                    { error: "Fitur Spotify adalah fitur premium. Silakan beli di Memory Shop atau upgrade ke Premium!" },
                    { status: 403 }
                )
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            await tx.photo.deleteMany({ where: { memoryId: id } })

            const updatedMemory = await tx.memory.update({
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
                    },
                    // Audio clip data — clear if null/undefined
                    audioUrl: audio?.url ?? null,
                    audioBucket: audio?.bucket ?? null,
                    audioPath: audio?.path ?? null,
                    audioStartTime: audio?.startTime ?? null,
                    audioDuration: audio?.duration ?? null,
                    audioFileName: audio?.fileName ?? null,
                    
                    // Spotify integration
                    spotifyTrackId: data.spotifyTrackId ?? null,
                    // Premium map marker
                    markerStyle: markerStyle ?? null,
                },
                include: { photos: true, tags: true }
            })

            // Handle Collaborators Update
            const existingCollabs = await tx.memoryCollaborator.findMany({ where: { memoryId: id } })
            const existingUserIds = existingCollabs.map(c => c.userId)

            const toDelete = existingUserIds.filter(uid => !requestedCollabs.includes(uid))
            const toAdd = requestedCollabs.filter(uid => !existingUserIds.includes(uid))

            if (toDelete.length > 0) {
                await tx.memoryCollaborator.deleteMany({
                    where: { memoryId: id, userId: { in: toDelete } }
                })
            }

            for (const userId of toAdd) {
                await tx.memoryCollaborator.create({
                    data: { memoryId: id, userId, status: "PENDING" }
                })
                await tx.notification.create({
                    data: {
                        type: "COLLABORATION_INVITE",
                        userId,
                        actorId: session.user.id,
                        memoryId: id,
                    }
                })
            }

            return updatedMemory
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
