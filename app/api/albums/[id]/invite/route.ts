import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: RouteParams) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const userId = session.user.id
        const body = await req.json()
        const { target, role } = body // target can be username or email

        if (!target || typeof target !== "string") {
            return NextResponse.json({ error: "Kolaborator tujuan wajib ditentukan" }, { status: 400 })
        }

        const resolvedRole = role === "EDITOR" ? "EDITOR" : "CONTRIBUTOR"

        // 1. Cari user tujuan
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: target },
                    { email: target }
                ]
            }
        })

        if (!targetUser) {
            return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 })
        }

        if (targetUser.id === userId) {
            return NextResponse.json({ error: "Anda tidak bisa mengundang diri sendiri" }, { status: 400 })
        }

        // 2. Ambil data album
        const album = await prisma.album.findUnique({
            where: { id },
            include: { collaborators: true }
        })

        if (!album) {
            return NextResponse.json({ error: "Album tidak ditemukan" }, { status: 404 })
        }

        // 3. Validasi Otorisasi Pengundang (Owner atau Editor)
        const isOwner = album.userId === userId
        const isEditor = album.collaborators.some(c => c.userId === userId && c.role === "EDITOR" && c.status === "ACCEPTED")

        if (!isOwner && !isEditor) {
            return NextResponse.json({ error: "Anda tidak memiliki akses untuk mengundang kontributor baru" }, { status: 403 })
        }

        // 4. Batas Maksimal Kontributor (Maksimal 5 orang termasuk Owner)
        // Jadi di tabel collaborators, jumlah yang berstatus PENDING atau ACCEPTED maksimal 4 orang.
        const activeCollabsCount = album.collaborators.filter(c => c.status === "PENDING" || c.status === "ACCEPTED").length
        if (activeCollabsCount >= 4) {
            return NextResponse.json({ error: "Batas maksimal kolaborator (5 orang) telah tercapai" }, { status: 400 })
        }

        // 5. Cek apakah target sudah tergabung atau sudah pernah diundang
        const existingCollab = album.collaborators.find(c => c.userId === targetUser.id)
        if (existingCollab) {
            if (existingCollab.status === "ACCEPTED") {
                return NextResponse.json({ error: "Pengguna sudah terdaftar di dalam album ini" }, { status: 400 })
            } else if (existingCollab.status === "PENDING") {
                return NextResponse.json({ error: "Pengguna sudah pernah diundang dan statusnya masih tertunda" }, { status: 400 })
            } else {
                // Jika statusnya DECLINED sebelumnya, kita perbarui relasinya kembali ke PENDING
                const updated = await prisma.albumCollaborator.update({
                    where: { id: existingCollab.id },
                    data: {
                        status: "PENDING",
                        role: resolvedRole
                    }
                })

                // Kirim ulang notifikasi
                await prisma.notification.create({
                    data: {
                        userId: targetUser.id,
                        actorId: userId,
                        albumId: id,
                        type: "ALBUM_INVITE"
                    }
                })

                return NextResponse.json(updated)
            }
        }

        // 6. Buat kolaborator baru
        const newCollab = await prisma.albumCollaborator.create({
            data: {
                albumId: id,
                userId: targetUser.id,
                role: resolvedRole,
                status: "PENDING"
            }
        })

        // 7. Buat notifikasi bertipe ALBUM_INVITE ke target user
        await prisma.notification.create({
            data: {
                userId: targetUser.id,
                actorId: userId,
                albumId: id,
                type: "ALBUM_INVITE"
            }
        })

        return NextResponse.json(newCollab, { status: 201 })
    } catch (error) {
        console.error("Invite collaborator error:", error)
        return NextResponse.json({ error: "Gagal mengundang kolaborator" }, { status: 500 })
    }
}
