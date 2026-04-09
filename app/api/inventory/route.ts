import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/inventory — Returns the current user's equipped item values by type
// GET /api/inventory?type=MEMORY_STICKER — Returns all owned stickers
export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ equippedFrame: null, equippedBanner: null })
    }

    const userId = session.user.id
    const url = new URL(req.url)
    const typeFilter = url.searchParams.get("type")

    // Special: return all owned items of a specific type
    if (typeFilter) {
        const items = await prisma.userInventory.findMany({
            where: { userId, item: { type: typeFilter as any } },
            include: {
                item: {
                    select: { id: true, type: true, value: true, previewColor: true, name: true, description: true },
                },
            },
            orderBy: { acquiredAt: "asc" },
        })
        return NextResponse.json({ items })
    }

    const equipped = await prisma.userInventory.findMany({
        where: { userId, isEquipped: true },
        include: {
            item: {
                select: { type: true, value: true, previewColor: true, name: true },
            },
        },
    })

    const equippedFrame = equipped.find((e) => e.item.type === "AVATAR_FRAME")?.item ?? null
    const equippedBanner = equipped.find((e) => e.item.type === "PROFILE_BANNER")?.item ?? null
    const equippedCardTheme = equipped.find((e) => e.item.type === "MEMORY_CARD_THEME")?.item ?? null

    return NextResponse.json({ equippedFrame, equippedBanner, equippedCardTheme })
}
