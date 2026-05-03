import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await auth()
        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") || "followers" // "followers" or "following"
        const search = searchParams.get("search") || ""

        // Only allow owners to see their own lists (based on user request)
        if (session?.user?.id !== id) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        let users = [];

        if (type === "followers") {
            const data = await prisma.follow.findMany({
                where: {
                    followingId: id,
                    follower: {
                        name: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                include: {
                    follower: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            bio: true,
                            isVerified: true,
                            premiumExpiresAt: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
            users = data.map(d => d.follower)
        } else {
            const data = await prisma.follow.findMany({
                where: {
                    followerId: id,
                    following: {
                        name: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                include: {
                    following: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            bio: true,
                            isVerified: true,
                            premiumExpiresAt: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
            users = data.map(d => d.following)
        }

        return NextResponse.json(users)
    } catch (error) {
        console.error("GET follows error:", error)
        return new NextResponse("Internal server error", { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user?.id || session.user.id !== id) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const { targetId, action } = await req.json()
        if (!targetId || !action) return new NextResponse("Bad request", { status: 400 })

        if (action === "unfollow") {
            await prisma.follow.deleteMany({
                where: { followerId: id, followingId: targetId }
            })
            return NextResponse.json({ success: true })
        } else if (action === "remove_follower") {
            await prisma.follow.deleteMany({
                where: { followerId: targetId, followingId: id }
            })
            return NextResponse.json({ success: true })
        }

        return new NextResponse("Invalid action", { status: 400 })
    } catch (error) {
        return new NextResponse("Server error", { status: 500 })
    }
}
