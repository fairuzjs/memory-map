import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client"
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"

import { commentSchema } from "@/lib/validations"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Blokir user yang belum verifikasi email
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isEmailVerified: true }
        })

        if (!currentUser || currentUser.isEmailVerified === false) {
            return NextResponse.json(
                { error: "EMAIL_NOT_VERIFIED", message: "Verifikasi email kamu terlebih dahulu sebelum berkomentar." },
                { status: 403 }
            )
        }

        // 1. Validasi Input (Hardening)
        const body = await req.json()
        const result = commentSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json({ error: "Invalid input", details: result.error.format() }, { status: 400 })
        }

        const { content: rawContent, parentId } = result.data

        // 2. Sanitasi (Basic)
        // Menghapus DOMPurify karena React otomatis melakukan escaping XSS,
        // dan isomorphic-dompurify menyebabkan segfault/crash di Vercel Node 24.
        const content = rawContent.trim()
        if (!content) {
            return NextResponse.json({ error: "Komentar tidak valid" }, { status: 400 })
        }

        // 3. Cek Eksistensi Memori (Data Consistency)
        const memory = await prisma.memory.findUnique({
            where: { id },
            select: { id: true, userId: true }
        })
        if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 })

        // 4. Rate Limit — 30 komentar per jam per user
        const rl = checkRateLimit(`comment:${session.user.id}`, RATE_LIMITS.COMMENT.limit, RATE_LIMITS.COMMENT.windowMs)
        if (!rl.success) return rateLimitResponse(rl.reset)


        const comment = await prisma.comment.create({
            data: {
                content,
                userId: session.user.id,
                memoryId: id,
                parentId: parentId || null
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
                memory: { select: { userId: true, title: true } },
                parent: { select: { userId: true } }
            }
        })

        // Notify memory owner
        if (comment.memory.userId !== session.user.id) {
            await prisma.notification.create({
                data: {
                    type: NotificationType.COMMENT, // Gunakan Enum
                    userId: comment.memory.userId,
                    actorId: session.user.id,
                    memoryId: id
                }
            })
        }

        // Notify parent comment owner if it's a reply
        if (comment.parentId && comment.parent && 
            comment.parent.userId !== session.user.id && 
            comment.parent.userId !== comment.memory.userId) {
            
            await prisma.notification.create({
                data: {
                    type: NotificationType.REPLY, // Gunakan Enum
                    userId: comment.parent.userId,
                    actorId: session.user.id,
                    memoryId: id
                }
            })
        }

        return NextResponse.json(comment, { status: 201 })
    } catch (error) {
        console.error("Comment Error:", error)
        return NextResponse.json({ error: "Failed to post comment" }, { status: 500 })
    }
}
