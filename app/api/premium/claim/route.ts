import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isPremiumActive } from "@/lib/premium-config"

// POST — user manually claims premium-exclusive items (Mahkota Royale + Langit Kerajaan)
export async function POST() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                isPremium: true,
                premiumExpiresAt: true,
                premiumItemsClaimed: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
        }

        // Must be active premium
        if (!user.isPremium || !user.premiumExpiresAt || !isPremiumActive(user.premiumExpiresAt)) {
            return NextResponse.json({ error: "Akun belum premium atau sudah expired" }, { status: 403 })
        }

        // Already claimed
        if (user.premiumItemsClaimed) {
            return NextResponse.json({ error: "Item premium sudah diklaim sebelumnya" }, { status: 409 })
        }

        // Find premium-exclusive items
        const premiumItemNames = ["Mahkota Royale", "Langit Kerajaan"]
        const premiumShopItems = await prisma.shopItem.findMany({
            where: { name: { in: premiumItemNames } },
            select: { id: true, name: true, type: true },
        })

        const claimedItems: string[] = []

        for (const shopItem of premiumShopItems) {
            // Skip if user already owns this item
            const existing = await prisma.userInventory.findUnique({
                where: { userId_itemId: { userId: session.user.id, itemId: shopItem.id } },
            })
            if (existing) {
                claimedItems.push(shopItem.name)
                continue
            }

            // Add to inventory WITHOUT auto-equip (isEquipped: false)
            await prisma.userInventory.create({
                data: {
                    userId: session.user.id,
                    itemId: shopItem.id,
                    isEquipped: false,
                },
            })
            claimedItems.push(shopItem.name)
        }

        // Mark as claimed
        await prisma.user.update({
            where: { id: session.user.id },
            data: { premiumItemsClaimed: true },
        })

        return NextResponse.json({
            success: true,
            claimedItems,
            message: `Berhasil mengklaim ${claimedItems.length} item premium!`,
        })
    } catch (error) {
        console.error("Premium claim error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}

// GET — check if user can claim premium items
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                isPremium: true,
                premiumExpiresAt: true,
                premiumItemsClaimed: true,
            },
        })

        if (!user) {
            return NextResponse.json({ canClaim: false })
        }

        const isActive = user.isPremium && user.premiumExpiresAt && isPremiumActive(user.premiumExpiresAt)
        const canClaim = isActive && !user.premiumItemsClaimed

        return NextResponse.json({ canClaim })
    } catch (error) {
        console.error("Premium claim check error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}
