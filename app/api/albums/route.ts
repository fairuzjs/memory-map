import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// Nama internal untuk album sistem
const SYSTEM_ALBUM_NAME = "Belum Dikelompokkan"
const SYSTEM_ALBUM_DESCRIPTION = "Kenangan yang belum dimasukkan ke album custom mana pun."
const SYSTEM_ALBUM_ICON = "📥"

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id
        const { searchParams } = req.nextUrl
        const sort = searchParams.get("sort") ?? "semua"
        const search = searchParams.get("search") ?? ""

        // ── Migrasi: rename legacy "Tanpa Album" → SYSTEM_ALBUM_NAME ──
        await prisma.album.updateMany({
            where: { userId, name: "Tanpa Album" },
            data: {
                name: SYSTEM_ALBUM_NAME,
                description: SYSTEM_ALBUM_DESCRIPTION,
                icon: SYSTEM_ALBUM_ICON,
            }
        })

        // ── 1. Kumpulkan semua memory yang accessible oleh user ──
        // 1a. Memory milik sendiri
        const ownMemories = await prisma.memory.findMany({
            where: { userId },
            select: { id: true }
        })
        const ownMemoryIds = ownMemories.map(m => m.id)

        // 1b. Memory kolaborasi ACCEPTED
        const collabEntries = await prisma.memoryCollaborator.findMany({
            where: { userId, status: "ACCEPTED" },
            select: { memoryId: true }
        })
        const collabMemoryIds = collabEntries.map(c => c.memoryId)

        // Gabungkan (dedup)
        const accessibleMemoryIds = [...new Set([...ownMemoryIds, ...collabMemoryIds])]

        if (accessibleMemoryIds.length > 0) {
            // ── 2. Pastikan album sistem ada ──
            let systemAlbum = await prisma.album.findFirst({
                where: { userId, name: SYSTEM_ALBUM_NAME }
            })
            if (!systemAlbum) {
                systemAlbum = await prisma.album.create({
                    data: {
                        userId,
                        name: SYSTEM_ALBUM_NAME,
                        description: SYSTEM_ALBUM_DESCRIPTION,
                        icon: SYSTEM_ALBUM_ICON,
                    }
                })
            }
            const systemAlbumId = systemAlbum.id

            // ── 3. Identifikasi memory yang sudah ada di album custom ──
            // Album custom = semua album user SELAIN sistem
            const customAlbumMemories = await prisma.albumMemory.findMany({
                where: {
                    album: {
                        userId,
                        name: { not: SYSTEM_ALBUM_NAME }
                    },
                    memoryId: { in: accessibleMemoryIds }
                },
                select: { memoryId: true }
            })
            const memoriesInCustomAlbum = new Set(customAlbumMemories.map(am => am.memoryId))

            // ── 4. Memory yang harus ada di album sistem (belum di custom) ──
            const memoriesForSystem = accessibleMemoryIds.filter(id => !memoriesInCustomAlbum.has(id))

            // ── 5. Hapus dari album sistem: memory yang sudah masuk ke album custom ──
            const memoriesInCustomSet = [...memoriesInCustomAlbum]
            if (memoriesInCustomSet.length > 0) {
                await prisma.albumMemory.deleteMany({
                    where: {
                        albumId: systemAlbumId,
                        memoryId: { in: memoriesInCustomSet }
                    }
                })
            }

            // ── 6. Tambahkan ke album sistem: memory yang belum punya album custom ──
            if (memoriesForSystem.length > 0) {
                await prisma.albumMemory.createMany({
                    data: memoriesForSystem.map(memoryId => ({
                        albumId: systemAlbumId,
                        memoryId
                    })),
                    skipDuplicates: true
                })
            }

            // ── 7. Bersihkan album sistem: hapus memory yang tidak accessible lagi ──
            await prisma.albumMemory.deleteMany({
                where: {
                    albumId: systemAlbumId,
                    memoryId: { notIn: accessibleMemoryIds }
                }
            })
        }

        // ── 8. Fetch semua album dengan memory count dan data kolaborator ──
        const whereClause: Prisma.AlbumWhereInput = {
            OR: [
                { userId },
                {
                    collaborators: {
                        some: {
                            userId,
                            status: "ACCEPTED"
                        }
                    }
                }
            ]
        }

        if (search) {
            whereClause.AND = [
                {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } }
                    ]
                }
            ]
        }

        const albums = await prisma.album.findMany({
            where: whereClause,
            include: {
                memories: {
                    select: { memoryId: true }
                },
                _count: {
                    select: { memories: true }
                },
                collaborators: {
                    where: {
                        status: "ACCEPTED"
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
                }
            }
        })

        // ── 9. Sort albums ──
        const sortedAlbums = [...albums]

        if (sort === "terbaru") {
            sortedAlbums.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        } else if (sort === "az") {
            sortedAlbums.sort((a, b) => a.name.localeCompare(b.name))
        } else if (sort === "banyak" || sort === "paling_banyak") {
            sortedAlbums.sort((a, b) => b._count.memories - a._count.memories)
        } else if (sort === "favorit") {
            sortedAlbums.sort((a, b) => {
                if (a.coverImage && !b.coverImage) return -1
                if (!a.coverImage && b.coverImage) return 1
                return b._count.memories - a._count.memories
            })
        }

        // Tandai album sistem dengan flag isSystemAlbum
        const albumsWithFlag = sortedAlbums.map(album => ({
            ...album,
            isSystemAlbum: album.name === SYSTEM_ALBUM_NAME
        }))

        return NextResponse.json(albumsWithFlag)
    } catch (error) {
        console.error("GET albums error:", error)
        return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, description, coverImage, icon } = body

        if (!name || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json({ error: "Nama album wajib diisi" }, { status: 400 })
        }

        // Cegah pembuatan album dengan nama sistem
        if (name.trim() === SYSTEM_ALBUM_NAME) {
            return NextResponse.json({ error: "Nama album tidak boleh sama dengan album sistem" }, { status: 400 })
        }

        const album = await prisma.album.create({
            data: {
                userId: session.user.id,
                name: name.trim(),
                description: description ? description.trim() : null,
                coverImage: coverImage || null,
                icon: icon || null,
            }
        })

        return NextResponse.json(album, { status: 201 })
    } catch (error) {
        console.error("POST album error:", error)
        return NextResponse.json({ error: "Failed to create album" }, { status: 500 })
    }
}
