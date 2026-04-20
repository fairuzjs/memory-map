import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: targetUser } = await params
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const currentUser = session.user.id

        if (currentUser === targetUser) {
            return new NextResponse("Cannot follow yourself", { status: 400 })
        }

        // Check if target user exists
        const target = await prisma.user.findUnique({ where: { id: targetUser } })
        if (!target) {
            return new NextResponse("User not found", { status: 404 })
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUser,
                    followingId: targetUser
                }
            }
        })

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: currentUser,
                        followingId: targetUser
                    }
                }
            })
            // Revalidate both users
            ;(revalidateTag as any)(CACHE_TAGS.user(currentUser))
            ;(revalidateTag as any)(CACHE_TAGS.user(targetUser))

            return NextResponse.json({ followed: false })
        } else {
            // Follow
            await prisma.$transaction(async (tx) => {
                await tx.follow.create({
                    data: {
                        followerId: currentUser,
                        followingId: targetUser
                    }
                })

                // Create notification for target user
                await tx.notification.create({
                    data: {
                        userId: targetUser,
                        actorId: currentUser,
                        type: "FOLLOW"
                    }
                })
            })
            // Revalidate both users
            ;(revalidateTag as any)(CACHE_TAGS.user(currentUser));
            ;(revalidateTag as any)(CACHE_TAGS.user(targetUser));

            return NextResponse.json({ followed: true })
        }
    } catch (error) {
        console.error("FOLLOW_ERROR:", error)
        return new NextResponse("Internal server error", { status: 500 })
    }
}
