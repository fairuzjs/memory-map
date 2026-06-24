"use server"

import { prisma } from "@/lib/prisma"

export async function checkBanStatus(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { bannedUntil: true, bannedReason: true }
        })

        if (!user) return { isBanned: false }

        if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
            return {
                isBanned: true,
                reason: user.bannedReason || "Pelanggaran pedoman komunitas"
            }
        }

        return { isBanned: false }
    } catch (error) {
        console.error("checkBanStatus error:", error)
        return { isBanned: false }
    }
}
