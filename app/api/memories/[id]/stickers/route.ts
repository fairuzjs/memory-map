import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_STICKERS_PER_MEMORY = 3

// GET /api/memories/[id]/stickers — fetch all placements for a memory
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: memoryId } = await params
        const placements = await prisma.memoryStickerPlacement.findMany({
            where: { memoryId },
            include: {
                item: { select: { id: true, name: true, value: true, previewColor: true } },
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
        })
        return NextResponse.json(placements)
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// POST /api/memories/[id]/stickers — add a sticker placement
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: memoryId } = await params
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const memory = await prisma.memory.findUnique({ where: { id: memoryId } })
        if (!memory) return NextResponse.json({ error: "Memory not found" }, { status: 404 })
        if (memory.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        // Check sticker count limit
        const existingCount = await prisma.memoryStickerPlacement.count({ where: { memoryId } })
        if (existingCount >= MAX_STICKERS_PER_MEMORY) {
            return NextResponse.json(
                { error: `Maksimal ${MAX_STICKERS_PER_MEMORY} stiker per kenangan` },
                { status: 422 }
            )
        }

        const body = await req.json()
        const { itemId, posX = 50, posY = 50, rotation, scale = 1.0, customText } = body

        if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 })

        // Validate customText length
        if (customText !== undefined && customText !== null && String(customText).length > 20) {
            return NextResponse.json({ error: "Teks kustom maksimal 20 karakter" }, { status: 400 })
        }

        // Verify user owns this sticker
        const inventory = await prisma.userInventory.findUnique({
            where: { userId_itemId: { userId: session.user.id, itemId } },
            include: { item: true },
        })
        if (!inventory || inventory.item.type !== "MEMORY_STICKER") {
            return NextResponse.json({ error: "Stiker tidak dimiliki" }, { status: 403 })
        }

        // Use default rotation from sticker config if not provided
        let finalRotation = rotation
        if (finalRotation === undefined || finalRotation === null) {
            try {
                const stickerVal = JSON.parse(inventory.item.value)
                finalRotation = stickerVal.defaultRotation ?? 0
            } catch {
                finalRotation = 0
            }
        }

        const placement = await prisma.memoryStickerPlacement.create({
            data: {
                memoryId, userId: session.user.id, itemId,
                posX, posY, rotation: finalRotation, scale,
                ...(customText !== undefined && customText !== null && { customText: String(customText).slice(0, 20) }),
            },
            include: {
                item: { select: { id: true, name: true, value: true, previewColor: true } },
                user: { select: { id: true, name: true } },
            },
        })

        return NextResponse.json(placement, { status: 201 })
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// PATCH /api/memories/[id]/stickers — update position of a placement
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: memoryId } = await params
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const memory = await prisma.memory.findUnique({ where: { id: memoryId } })
        if (!memory || memory.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { placementId, posX, posY, rotation, scale, customText } = body
        if (!placementId) return NextResponse.json({ error: "placementId required" }, { status: 400 })

        if (customText !== undefined && customText !== null && String(customText).length > 20) {
            return NextResponse.json({ error: "Teks kustom maksimal 20 karakter" }, { status: 400 })
        }

        const updated = await prisma.memoryStickerPlacement.update({
            where: { id: placementId },
            data: {
                ...(posX !== undefined && { posX }),
                ...(posY !== undefined && { posY }),
                ...(rotation !== undefined && { rotation }),
                ...(scale !== undefined && { scale }),
                ...(customText !== undefined && { customText: customText === null ? null : String(customText).slice(0, 20) }),
            },
            include: {
                item: { select: { id: true, name: true, value: true, previewColor: true } },
            },
        })
        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// DELETE /api/memories/[id]/stickers?placementId=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: memoryId } = await params
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const memory = await prisma.memory.findUnique({ where: { id: memoryId } })
        if (!memory || memory.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const url = new URL(req.url)
        const placementId = url.searchParams.get("placementId")
        if (!placementId) return NextResponse.json({ error: "placementId required" }, { status: 400 })

        await prisma.memoryStickerPlacement.delete({ where: { id: placementId } })
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
