import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit"
import { globalChatSchema } from "@/lib/validations"
import { captureError } from "@/lib/monitoring"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const url = new URL(req.url)
        const singleId = url.searchParams.get("singleId")

        if (singleId) {
            const message = await prisma.globalChatMessage.findUnique({
                where: { id: singleId, isDeleted: false },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                            role: true,
                            isVerified: true,
                            isPremium: true
                        }
                    }
                }
            })
            return NextResponse.json({ message })
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
                include: {
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
                    }
                }
            })

            return NextResponse.json({ messages: newMessages })
        }

        const cursor = url.searchParams.get("cursor")
        const take = 50

        const messages = await prisma.globalChatMessage.findMany({
            take: take + 1, // Fetch +1 to know if there's a next page
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
            where: { isDeleted: false },
            include: {
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
                }
            }
        })

        let nextCursor: string | null = null
        if (messages.length > take) {
            const nextItem = messages.pop() // Remove the extra item
            nextCursor = nextItem!.id
        }

        // Return messages in reverse order (oldest to newest) to match chat behavior
        return NextResponse.json({
            messages: messages.reverse(),
            nextCursor,
        })
    } catch (error) {
        captureError(error, { route: "GET /api/global-chat" })
        return NextResponse.json({ error: "Gagal memuat obrolan" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Rate Limit
        const ip = getClientIP(req)
        const rateLimitKey = `global-chat:${session.user.id}:${ip}`
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.GLOBAL_CHAT.limit, RATE_LIMITS.GLOBAL_CHAT.windowMs)
        
        if (!rateLimitResult.success) {
            return rateLimitResponse(rateLimitResult.reset)
        }

        const body = await req.json()
        const parsed = globalChatSchema.safeParse(body)
        
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }

        const message = await prisma.globalChatMessage.create({
            data: {
                content: parsed.data.content,
                userId: session.user.id,
            },
            include: {
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
                }
            }
        })

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        captureError(error, { route: "POST /api/global-chat" })
        return NextResponse.json({ error: "Gagal mengirim obrolan" }, { status: 500 })
    }
}
