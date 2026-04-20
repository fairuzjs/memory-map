export const CACHE_TAGS = {
    users: "users",
    user: (id: string) => `user-${id}`,
    memories: "memories",
    userMemories: (userId: string) => `user-memories-${userId}`,
    leaderboard: "leaderboard",
    publicFeed: "public-feed",
} as const;
