import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getCachedUser } from "@/lib/services/user-service"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();

        const user = await getCachedUser(id)

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        let isFollowing = false;
        if (session?.user?.id && session.user.id !== id) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: session.user.id,
                        followingId: id
                    }
                }
            })
            if (follow) isFollowing = true;
        }

        return NextResponse.json({ ...user, isFollowing })
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

        const { name, bio, image, instagram, tiktok, facebook, pinnedBadge, username } = await req.json()

        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        // Validate pinnedBadge if not null
        if (pinnedBadge !== null && pinnedBadge !== undefined) {
            const hasBadge = await prisma.userStreakBadge.findFirst({
                where: { userId: id, milestone: pinnedBadge }
            })
            if (!hasBadge) {
                return NextResponse.json({ error: "Kamu belum membuka badge ini." }, { status: 403 })
            }
        }

        // Validate & sanitize username
        let cleanUsername: string | null | undefined = undefined // undefined = don't touch
        if (username !== undefined) {
            if (username === null || username === "") {
                cleanUsername = null
            } else {
                const u = username.trim().toLowerCase()
                if (!/^[a-z0-9_.]{3,30}$/.test(u)) {
                    return NextResponse.json(
                        { error: "Username hanya boleh berisi huruf, angka, underscore, dan titik (3-30 karakter)" },
                        { status: 400 }
                    )
                }
                // Check uniqueness (exclude current user)
                const existing = await prisma.user.findUnique({ where: { username: u } })
                if (existing && existing.id !== id) {
                    return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 })
                }
                cleanUsername = u
            }
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
                ...(cleanUsername !== undefined ? { username: cleanUsername } : {}),
            },
            select: { id: true, username: true, name: true, bio: true, image: true, instagram: true, tiktok: true, facebook: true, pinnedBadge: true }
        })

        // Revalidate cache
        ;(revalidateTag as any)(CACHE_TAGS.user(id))

        return NextResponse.json(updated)
    } catch (error) {
        console.error("PATCH user error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
