import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                bio: true,
                image: true,
                instagram: true,
                tiktok: true,
                facebook: true,
                createdAt: true,
                pinnedBadge: true,
                streakBadges: {
                    select: { milestone: true }
                },
                _count: {
                    select: {
                        memories: { where: { isPublic: true } },
                        comments: true,
                        reactions: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("GET user error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { name, bio, image, instagram, tiktok, facebook, pinnedBadge } = await req.json()

        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        // Sanitize social links — store as-is (empty string → null)
        const clean = (v: string | undefined) => v?.trim() || null

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name: name.trim(),
                bio: bio?.trim() || null,
                image: image || null,
                instagram: clean(instagram),
                tiktok: clean(tiktok),
                facebook: clean(facebook),
                pinnedBadge: pinnedBadge === null ? null : (pinnedBadge || undefined),
            },
            select: { id: true, name: true, bio: true, image: true, instagram: true, tiktok: true, facebook: true, pinnedBadge: true }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PATCH user error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
