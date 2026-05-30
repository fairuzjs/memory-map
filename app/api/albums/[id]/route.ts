import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SYSTEM_ALBUM_NAME = "Belum Dikelompokkan"

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

        const album = await prisma.album.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                },
                collaborators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                memories: {
                    include: {
                        memory: {
                            include: {
                                photos: true,
                                stickerPlacements: {
                                    include: {
                                        item: { select: { id: true, name: true, value: true, previewColor: true } }
                                    },
                                    orderBy: { createdAt: "asc" }
                                },
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        premiumExpiresAt: true,
                                    }
                                },
                                _count: { select: { reactions: true, comments: true } }
                            }
                        }
                    }
                }
            }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        // Validasi Otorisasi Keanggotaan
        const isOwner = album.userId === userId
        const isAcceptedCollab = album.collaborators.some(c => c.userId === userId && c.status === "ACCEPTED")

        if (!isOwner && !isAcceptedCollab) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke album ini" }, { status: 403 })
        }

        const isSystemAlbum = album.name === SYSTEM_ALBUM_NAME

        // Format memories sebagai array Memory untuk kemudahan frontend
        const formattedMemories = album.memories
            .map(am => am.memory)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return NextResponse.json({
            ...album,
            isSystemAlbum,
            memories: formattedMemories
        })
    } catch (error) {
        console.error("GET album by ID error:", error)
        return NextResponse.json({ error: "Gagal mengambil detail album" }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { name, description, coverImage, icon, approvePendingCover, rejectPendingCover } = body
        const userId = session.user.id

        // Fetch album dengan kolaborator
        const existingAlbum = await prisma.album.findUnique({
            where: { id },
            include: { collaborators: true }
        })

        if (!existingAlbum) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        const isOwner = existingAlbum.userId === userId
        const isEditor = existingAlbum.collaborators.some(c => c.userId === userId && c.role === "EDITOR" && c.status === "ACCEPTED")

        if (!isOwner && !isEditor) {
            return NextResponse.json({ error: "Anda tidak memiliki akses untuk menyunting album ini" }, { status: 403 })
        }

        // Jika Owner menyetujui/menolak pengajuan cover
        if (isOwner && (approvePendingCover || rejectPendingCover)) {
            let updatedData: any = {
                pendingCoverImage: null,
                pendingCoverActorId: null
            }
            if (approvePendingCover && existingAlbum.pendingCoverImage) {
                updatedData.coverImage = existingAlbum.pendingCoverImage
            }
            const updatedAlbum = await prisma.album.update({
                where: { id },
                data: updatedData
            })
            return NextResponse.json(updatedAlbum)
        }

        // Jika Editor ingin mengubah cover (butuh persetujuan Owner)
        if (isEditor && !isOwner) {
            if (coverImage) {
                const updatedAlbum = await prisma.album.update({
                    where: { id },
                    data: {
                        pendingCoverImage: coverImage,
                        pendingCoverActorId: userId
                    }
                })
                
                // Kirim notifikasi ke Owner (Tipe ALBUM_INVITE mewakili pengajuan/aksi kolaborasi album)
                await prisma.notification.create({
                    data: {
                        userId: existingAlbum.userId,
                        actorId: userId,
                        albumId: id,
                        type: "ALBUM_INVITE"
                    }
                })

                return NextResponse.json({
                    ...updatedAlbum,
                    message: "Pengajuan perubahan sampul berhasil dikirim ke Owner untuk disetujui"
                })
            }
            return NextResponse.json({ error: "Editor hanya diperbolehkan mengajukan perubahan sampul album" }, { status: 400 })
        }

        // Hanya Owner yang bisa mengedit detail utama (nama, deskripsi, icon, atau coverImage langsung)
        if (existingAlbum.name === SYSTEM_ALBUM_NAME && name && name !== SYSTEM_ALBUM_NAME) {
            return NextResponse.json({ error: "Album sistem tidak dapat diubah namanya" }, { status: 400 })
        }

        if (name && name.trim() === SYSTEM_ALBUM_NAME && existingAlbum.name !== SYSTEM_ALBUM_NAME) {
            return NextResponse.json({ error: "Nama album tidak boleh sama dengan album sistem" }, { status: 400 })
        }

        const updatedAlbum = await prisma.album.update({
            where: { id },
            data: {
                name: name ? name.trim() : existingAlbum.name,
                description: description !== undefined ? (description ? description.trim() : null) : existingAlbum.description,
                coverImage: coverImage !== undefined ? coverImage : existingAlbum.coverImage,
                icon: icon !== undefined ? icon : existingAlbum.icon,
            }
        })

        return NextResponse.json(updatedAlbum)
    } catch (error) {
        console.error("PUT album error:", error)
        return NextResponse.json({ error: "Gagal memperbarui album" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const existingAlbum = await prisma.album.findUnique({
            where: { id, userId: session.user.id }
        })

        if (!existingAlbum) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        // Cegah penghapusan album sistem
        if (existingAlbum.name === SYSTEM_ALBUM_NAME) {
            return NextResponse.json({ error: "Album sistem tidak dapat dihapus" }, { status: 400 })
        }

        // Hapus album (cascade deletes album_memories via schema)
        await prisma.album.delete({ where: { id } })

        // Setelah hapus album custom, cek memory mana yang tidak punya album custom lagi
        // → kembalikan ke album sistem
        // Dapatkan semua memoryId yang pernah ada di album ini (dari DB cascade sudah terhapus,
        // tapi kita punya list dari sebelum delete — ambil dari album_memories sebelum delete)
        // Karena cascade delete sudah terjadi, kita trigger sync lewat GET /api/albums saat frontend refresh.
        // Alternatif: jalankan mini-sync di sini.
        const userId = session.user.id

        // Ambil memory yang tidak punya album custom lagi
        const userCustomAlbums = await prisma.album.findMany({
            where: { userId, name: { not: SYSTEM_ALBUM_NAME } },
            select: { id: true }
        })
        const customAlbumIds = userCustomAlbums.map(a => a.id)

        // Memory accessible (own + kolaborasi)
        const ownMemories = await prisma.memory.findMany({ where: { userId }, select: { id: true } })
        const collabEntries = await prisma.memoryCollaborator.findMany({
            where: { userId, status: "ACCEPTED" },
            select: { memoryId: true }
        })
        const accessibleIds = [...new Set([
            ...ownMemories.map(m => m.id),
            ...collabEntries.map(c => c.memoryId)
        ])]

        if (accessibleIds.length > 0) {
            // Memory yang masih punya album custom
            const inCustomAlbum = customAlbumIds.length > 0
                ? await prisma.albumMemory.findMany({
                    where: { albumId: { in: customAlbumIds }, memoryId: { in: accessibleIds } },
                    select: { memoryId: true }
                })
                : []
            const inCustomSet = new Set(inCustomAlbum.map(am => am.memoryId))

            // Memory yang perlu kembali ke sistem
            const needSystem = accessibleIds.filter(id => !inCustomSet.has(id))

            if (needSystem.length > 0) {
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
                await prisma.albumMemory.createMany({
                    data: needSystem.map(memoryId => ({
                        albumId: systemAlbum!.id,
                        memoryId
                    })),
                    skipDuplicates: true
                })
            }
        }

        return NextResponse.json({ success: true, message: "Album berhasil dihapus" })
    } catch (error) {
        console.error("DELETE album error:", error)
        return NextResponse.json({ error: "Gagal menghapus album" }, { status: 500 })
    }
}

// Constants juga dibutuhkan di DELETE
const SYSTEM_ALBUM_DESCRIPTION = "Kenangan yang belum dimasukkan ke album custom mana pun."
const SYSTEM_ALBUM_ICON = "📥"
