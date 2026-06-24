import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { globalChatSchema } from "@/lib/validations"
import { captureError } from "@/lib/monitoring"
import { checkMessage, resolveAction, banGuest, isGuestBanned, getViolationCount, getGuestBannedUntil } from "@/lib/profanity"

// ── Shared include for replyTo preview ──────────────────────────────────────
const replyToInclude = {
    select: {
        id: true,
        content: true,
        isGuest: true,
        guestName: true,
        user: {
            select: {
                id: true,
                name: true,
            }
        }
    }
}

const messageInclude = {
    user: {
        select: {
            id: true,
            name: true,
            username: true,
            image: true,
            role: true,
            isVerified: true,
            isPremium: true,
        }
    },
    replyTo: replyToInclude,
}

export async function GET(req: Request) {
    try {
        const session = await auth()

        const url = new URL(req.url)
        const singleId = url.searchParams.get("singleId")
        const guestIdParam = url.searchParams.get("guestId")

        // Hitung banned status
        let bannedUntil: string | null = null;
        if (!session?.user) {
            if (guestIdParam) {
                const ip = getClientIP(req);
                const senderId = guestIdParam || ip;
                const guestBanMs = getGuestBannedUntil(senderId);
                if (guestBanMs) bannedUntil = new Date(guestBanMs).toISOString();
            }
        } else {
            const dbUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { bannedUntil: true, globalChatBannedUntil: true }
            })
            if (dbUser?.bannedUntil && new Date(dbUser.bannedUntil) > new Date()) {
                bannedUntil = dbUser.bannedUntil.toISOString();
            } else if (dbUser?.globalChatBannedUntil && new Date(dbUser.globalChatBannedUntil) > new Date()) {
                bannedUntil = dbUser.globalChatBannedUntil.toISOString();
            }
        }

        const formatMessage = (m: any) => {
            if (m.isGuest) {
                return {
                    ...m,
                    user: {
                        id: m.guestId,
                        name: m.guestName,
                        username: null,
                        image: null,
                        role: "USER",
                        isVerified: false,
                        isPremium: false,
                    },
                    replyTo: m.replyTo ? {
                        ...m.replyTo,
                        user: m.replyTo.isGuest ? {
                            id: m.replyTo.guestId,
                            name: m.replyTo.guestName,
                        } : m.replyTo.user
                    } : null
                }
            }
            
            // Format replyTo if reply is a guest
            const formattedReply = m.replyTo ? {
                ...m.replyTo,
                user: m.replyTo.isGuest ? {
                    id: m.replyTo.guestId,
                    name: m.replyTo.guestName,
                } : m.replyTo.user
            } : null

            return {
                ...m,
                replyTo: formattedReply
            }
        }

        if (singleId) {
            const message = await prisma.globalChatMessage.findUnique({
                where: { id: singleId, isDeleted: false },
                include: messageInclude,
            })
            return NextResponse.json({ message: message ? formatMessage(message) : null })
        }

        // Incremental polling: hanya ambil pesan setelah ID tertentu
        const afterId = url.searchParams.get("after")
        if (afterId) {
            const afterMessage = await prisma.globalChatMessage.findUnique({
                where: { id: afterId },
                select: { createdAt: true }
            })

            const newMessages = await prisma.globalChatMessage.findMany({
                where: {
                    isDeleted: false,
                    createdAt: { gt: afterMessage?.createdAt ?? new Date(0) }
                },
                orderBy: { createdAt: "asc" },
                take: 100,
                include: messageInclude,
            })

            return NextResponse.json({ messages: newMessages.map(formatMessage), bannedUntil })
        }

        const cursor = url.searchParams.get("cursor")
        const take = 50

        const messages = await prisma.globalChatMessage.findMany({
            take: take + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
            where: { isDeleted: false },
            include: messageInclude,
        })

        let nextCursor: string | null = null
        if (messages.length > take) {
            const nextItem = messages.pop()
            nextCursor = nextItem!.id
        }

        return NextResponse.json({
            messages: messages.reverse().map(formatMessage),
            nextCursor,
            bannedUntil
        })
    } catch (error) {
        captureError(error, { route: "GET /api/global-chat" })
        return NextResponse.json({ error: "Gagal memuat obrolan" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        const isGuest = !session?.user?.id
        
        const ip = getClientIP(req)
        const rateLimitKey = `global-chat:${session?.user?.id || ip}:${ip}`
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.GLOBAL_CHAT.limit, RATE_LIMITS.GLOBAL_CHAT.windowMs)
        
        if (!rateLimitResult.success) {
            return rateLimitResponse(rateLimitResult.reset)
        }

        const body = await req.json()
        const parsed = globalChatSchema.safeParse(body)
        
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }

        const content = parsed.data.content
        const guestId = parsed.data.guestId
        const guestName = parsed.data.guestName

        // Apply length constraints
        if (isGuest && content.length > 100) {
            return NextResponse.json({ error: "Pesan tamu maksimal 100 karakter" }, { status: 400 })
        } else if (!isGuest && content.length > 300) {
            return NextResponse.json({ error: "Pesan maksimal 300 karakter" }, { status: 400 })
        }

        // Pre-check active bans
        const senderId = isGuest ? (guestId || ip) : session.user.id
        
        if (isGuest) {
            const guestBanMs = getGuestBannedUntil(senderId);
            if (guestBanMs) {
                return NextResponse.json({ error: "Anda dilarang mengakses obrolan global karena pelanggaran berulang. Coba lagi nanti.", bannedUntil: new Date(guestBanMs).toISOString() }, { status: 403 })
            }
        } else {
            const dbUser = await prisma.user.findUnique({
                where: { id: senderId },
                select: { bannedUntil: true, globalChatBannedUntil: true }
            })
            if (dbUser?.bannedUntil && new Date(dbUser.bannedUntil) > new Date()) {
                return NextResponse.json({ error: "Akun Anda telah dibanned secara permanen.", bannedUntil: dbUser.bannedUntil.toISOString() }, { status: 403 })
            }
            if (dbUser?.globalChatBannedUntil && new Date(dbUser.globalChatBannedUntil) > new Date()) {
                return NextResponse.json({ error: "Anda dilarang mengirim pesan di obrolan global karena pelanggaran berulang. Coba lagi nanti.", bannedUntil: dbUser.globalChatBannedUntil.toISOString() }, { status: 403 })
            }
        }

        // Run profanity filter v2
        const profanityResult = checkMessage(content, senderId)
        const filterAction = resolveAction(profanityResult, senderId)
        const violations = getViolationCount(senderId)

        if (filterAction === "BLOCK" || filterAction === "BAN_REVIEW") {
            // Evaluasi pelanggaran
            if (filterAction === "BAN_REVIEW") {
                // Pelanggaran sangat berat (BAN PERMANEN)
                let untilStr = "";
                if (isGuest) {
                    const until = Date.now() + 24 * 60 * 60 * 1000;
                    untilStr = new Date(until).toISOString();
                    banGuest(senderId, 24 * 60 * 60 * 1000) // Guest ban 24h
                } else {
                    untilStr = new Date("9999-12-31T23:59:59Z").toISOString();
                    await prisma.user.update({
                        where: { id: senderId },
                        data: {
                            bannedUntil: new Date("9999-12-31T23:59:59Z"), // Banned selamanya
                            bannedReason: profanityResult.reason || "Pelanggaran sangat berat di Global Chat"
                        }
                    })
                }
                return NextResponse.json({ error: profanityResult.reason + " Akun Anda telah dibanned permanen.", bannedUntil: untilStr, isPermanentBan: !isGuest }, { status: 403 })
            } else if (filterAction === "BLOCK" && violations >= 3) {
                // Pelanggaran berulang (BAN SEMENTARA 3 JAM)
                let untilStr = "";
                if (isGuest) {
                    const until = Date.now() + 3 * 60 * 60 * 1000;
                    untilStr = new Date(until).toISOString();
                    banGuest(senderId, 3 * 60 * 60 * 1000) // Guest ban 3h
                } else {
                    const until = new Date(Date.now() + 3 * 60 * 60 * 1000);
                    untilStr = until.toISOString();
                    await prisma.user.update({
                        where: { id: senderId },
                        data: {
                            globalChatBannedUntil: until
                        }
                    })
                }
                return NextResponse.json({ error: profanityResult.reason + " Anda dilarang chat selama 3 jam ke depan.", bannedUntil: untilStr }, { status: 403 })
            }
            
            // Block biasa (baru pelanggaran 1-2 kali)
            return NextResponse.json({ error: profanityResult.reason || "Pesan diblokir karena mengandung kata yang tidak pantas." }, { status: 400 })
        }

        if (isGuest) {
            if (!guestId || !guestName) {
                return NextResponse.json({ error: "Guest data missing" }, { status: 400 })
            }
            
            // Check guest chat limit
            const guestChatCount = await prisma.globalChatMessage.count({
                where: { guestId, isGuest: true, isDeleted: false }
            })

            if (guestChatCount >= 3) {
                return NextResponse.json({ error: "Batas chat tamu (3x) telah habis. Silakan mendaftar!" }, { status: 403 })
            }
        }

        // Validate replyToId if provided
        const replyToId: string | undefined = parsed.data.replyToId
        if (replyToId) {
            const replyTarget = await prisma.globalChatMessage.findUnique({
                where: { id: replyToId, isDeleted: false },
                select: { id: true }
            })
            if (!replyTarget) {
                return NextResponse.json({ error: "Pesan yang di-reply tidak ditemukan" }, { status: 400 })
            }
        }

        const message = await prisma.globalChatMessage.create({
            data: {
                content,
                userId: isGuest ? null : session.user.id,
                isGuest,
                guestId: isGuest ? guestId : null,
                guestName: isGuest ? guestName : null,
                ...(replyToId ? { replyToId } : {}),
            },
            include: messageInclude,
        })

        // Format message if guest
        const formattedMessage = isGuest ? {
            ...message,
            user: {
                id: guestId,
                name: guestName,
                username: null,
                image: null,
                role: "USER",
                isVerified: false,
                isPremium: false,
            }
        } : message

        return NextResponse.json(formattedMessage, { status: 201 })
    } catch (error) {
        captureError(error, { route: "POST /api/global-chat" })
        return NextResponse.json({ error: "Gagal mengirim obrolan" }, { status: 500 })
    }
}
