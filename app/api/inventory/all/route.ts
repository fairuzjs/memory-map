import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/inventory/all — Returns ALL owned items for the current user
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const items = await prisma.userInventory.findMany({
        where: { userId },
        include: {
            item: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    type: true,
                    value: true,
                    previewColor: true,
                },
            },
        },
        orderBy: [
            { isEquipped: "desc" },
            { acquiredAt: "asc" },
        ],
    })

    return NextResponse.json({ items })
}
