import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SYSTEM_ALBUM_NAME = "Belum Dikelompokkan"
const SYSTEM_ALBUM_DESCRIPTION = "Kenangan yang belum dimasukkan ke album custom mana pun."
const SYSTEM_ALBUM_ICON = "📥"

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

        // Fetch semua album custom yang dimiliki memory ini (untuk user ini), kecuali album sistem
        const associations = await prisma.albumMemory.findMany({
            where: {
                memoryId: id,
                album: {
                    userId: session.user.id,
                    name: { not: SYSTEM_ALBUM_NAME }
                }
            },
            select: {
                albumId: true
            }
        })

        return NextResponse.json(associations.map(a => a.albumId))
    } catch (error) {
        console.error("GET memory albums error:", error)
        return NextResponse.json({ error: "Failed to fetch memory albums" }, { status: 500 })
    }
}

export async function POST(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: memoryId } = await params
        const body = await req.json()
        const { albumIds } = body // Array of album ID custom yang dipilih

        if (!Array.isArray(albumIds)) {
            return NextResponse.json({ error: "albumIds must be an array" }, { status: 400 })
        }

        const userId = session.user.id

        // Verifikasi memory ada dan user punya akses (own atau kolaborasi)
        const memory = await prisma.memory.findUnique({
            where: { id: memoryId },
            select: { userId: true }
        })

        if (!memory) {
            return NextResponse.json({ error: "Memory not found" }, { status: 404 })
        }

        // Cek akses: user harus owner atau collaborator ACCEPTED
        const isOwner = memory.userId === userId
        if (!isOwner) {
            const isCollaborator = await prisma.memoryCollaborator.findUnique({
                where: { memoryId_userId: { memoryId, userId } },
                select: { status: true }
            })
            if (!isCollaborator || isCollaborator.status !== "ACCEPTED") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
            }
        }

        // Filter albumIds agar hanya album milik user ini
        const userCustomAlbums = await prisma.album.findMany({
            where: {
                id: { in: albumIds },
                userId,
                name: { not: SYSTEM_ALBUM_NAME }
            },
            select: { id: true }
        })
        const validCustomAlbumIds = userCustomAlbums.map(a => a.id)

        await prisma.$transaction(async (tx) => {
            // Hapus semua relasi album CUSTOM yang lama untuk memory ini (milik user ini)
            await tx.albumMemory.deleteMany({
                where: {
                    memoryId,
                    album: {
                        userId,
                        name: { not: SYSTEM_ALBUM_NAME }
                    }
                }
            })

            if (validCustomAlbumIds.length > 0) {
                // Ada album custom yang dipilih:
                // → Tambahkan ke album custom yang dipilih
                await tx.albumMemory.createMany({
                    data: validCustomAlbumIds.map(albumId => ({ albumId, memoryId })),
                    skipDuplicates: true
                })

                // → Hapus dari album sistem (tidak boleh ada di sistem jika sudah di custom)
                const systemAlbum = await tx.album.findFirst({
                    where: { userId, name: SYSTEM_ALBUM_NAME }
                })
                if (systemAlbum) {
                    await tx.albumMemory.deleteMany({
                        where: { albumId: systemAlbum.id, memoryId }
                    })
                }
            } else {
                // Tidak ada album custom yang dipilih:
                // → Cek apakah memory ini masih punya album custom lain dari user lain
                //   (untuk memory kolaborasi, album lain tidak relevan untuk user ini)
                // → Kembalikan ke album sistem karena belum di-custom-album mana pun

                let systemAlbum = await tx.album.findFirst({
                    where: { userId, name: SYSTEM_ALBUM_NAME }
                })
                if (!systemAlbum) {
                    systemAlbum = await tx.album.create({
                        data: {
                            userId,
                            name: SYSTEM_ALBUM_NAME,
                            description: SYSTEM_ALBUM_DESCRIPTION,
                            icon: SYSTEM_ALBUM_ICON,
                        }
                    })
                }
                await tx.albumMemory.createMany({
                    data: [{ albumId: systemAlbum.id, memoryId }],
                    skipDuplicates: true
                })
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("POST memory albums error:", error)
        return NextResponse.json({ error: "Failed to update memory albums" }, { status: 500 })
    }
}
