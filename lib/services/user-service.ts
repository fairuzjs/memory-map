import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"

export const getCachedUser = (id: string) => {
    return unstable_cache(
        async () => {
            const [user, collabCount] = await Promise.all([
                prisma.user.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        bio: true,
                        image: true,
                        isVerified: true,
                        isEmailVerified: true,
                        instagram: true,
                        tiktok: true,
                        facebook: true,
                        createdAt: true,
                        pinnedBadge: true,
                        streakBadges: {
                            select: { milestone: true }
                        },
                        inventories: {
                            where: { isEquipped: true },
                            select: {
                                item: {
                                    select: { type: true, value: true, previewColor: true, name: true }
                                }
                            }
                        },
                        _count: {
                            select: {
                                memories: { where: { isPublic: true } },
                                comments: true,
                                reactions: true,
                                followers: true,
                                following: true
                            }
                        }
                    }
                }),
                prisma.memory.count({
                    where: {
                        collaborators: { some: { userId: id, status: "ACCEPTED" } },
                        isPublic: true
                    }
                })
            ])

            if (!user) return null

            // Reshape equipped items
            const equippedFrame = user.inventories.find(inv => inv.item.type === "AVATAR_FRAME")?.item ?? null
            const equippedBanner = user.inventories.find(inv => inv.item.type === "PROFILE_BANNER")?.item ?? null
            const equippedDecoration = user.inventories.find(inv => inv.item.type === "USERNAME_DECORATION")?.item ?? null

            return { 
                ...user, 
                equippedFrame, 
                equippedBanner, 
                equippedDecoration,
                _count: {
                    ...user._count,
                    memories: (user._count?.memories || 0) + collabCount
                }
            }
        },
        [CACHE_TAGS.user(id)],
        {
            tags: [CACHE_TAGS.user(id), CACHE_TAGS.users],
            revalidate: 3600, // 1 hour fallback
        }
    )()
}

export const getCachedUserByUsername = (username: string) => {
    return unstable_cache(
        async () => {
            const user = await prisma.user.findUnique({
                where: { username },
                select: { id: true }
            })
            return user;
        },
        [`username-${username}`],
        {
            tags: [CACHE_TAGS.users],
            revalidate: 3600
        }
    )()
}

export const getCachedLeaderboard = () => {
    return unstable_cache(
        async () => {
            const topStreakers = await prisma.userStreak.findMany({
                where: { longestStreak: { gt: 0 } },
                orderBy: { longestStreak: "desc" },
                take: 50,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                            isVerified: true,
                            isEmailVerified: true,
                            inventories: {
                                where: { isEquipped: true, item: { type: "USERNAME_DECORATION" } },
                                select: { item: { select: { name: true, value: true } } }
                            }
                        }
                    }
                }
            })

            return topStreakers.map((s, i) => ({
                rank: i + 1,
                userId: s.user.id,
                name: s.user.username || s.user.name,
                image: s.user.image,
                isVerified: s.user.isVerified,
                isEmailVerified: s.user.isEmailVerified,
                longestStreak: s.longestStreak,
                currentStreak: s.currentStreak,
                equippedDecoration: s.user.inventories[0]?.item ?? null,
            }))
        },
        [CACHE_TAGS.leaderboard],
        { tags: [CACHE_TAGS.leaderboard], revalidate: 3600 }
    )()
}
