import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"
import { Prisma } from "@prisma/client"

export const getCachedPublicMemories = (userId: string) => {
    return unstable_cache(
        async () => {
            const memories = await prisma.memory.findMany({
                where: {
                    OR: [
                        { userId, isPublic: true },
                        { collaborators: { some: { userId, status: "ACCEPTED" } }, isPublic: true }
                    ]
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            premiumExpiresAt: true,
                            inventories: {
                                where: { isEquipped: true, item: { type: "MEMORY_CARD_THEME" } },
                                select: { item: { select: { value: true } } },
                                take: 1,
                            }
                        }
                    },
                    photos: true,
                    stickerPlacements: {
                        include: {
                            item: { select: { id: true, name: true, value: true, previewColor: true } }
                        },
                        orderBy: { createdAt: "asc" }
                    },
                    collaborators: {
                        select: { userId: true, status: true }
                    },
                    _count: { select: { reactions: true, comments: true } }
                },
                orderBy: { date: "desc" }
            })

            return memories.map((m: any) => ({
                ...m,
                isCollaboration: m.userId !== userId
            }))
        },
        ["v2", CACHE_TAGS.userMemories(userId)],
        {
            tags: [CACHE_TAGS.userMemories(userId), CACHE_TAGS.memories],
            revalidate: 3600
        }
    )()
}
