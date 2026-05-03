/**
 * One-off script: Grant premium items to all existing premium users.
 * Run once after deploying the premium item granting feature.
 * 
 * Usage: npx tsx prisma/grant-premium-items.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    // Find premium-exclusive shop items
    const premiumItemNames = ["Mahkota Royale", "Langit Kerajaan"]
    const premiumShopItems = await prisma.shopItem.findMany({
        where: { name: { in: premiumItemNames } },
        select: { id: true, name: true, type: true },
    })

    if (premiumShopItems.length === 0) {
        console.log("❌ Premium shop items not found. Run seed-shop.ts first.")
        return
    }

    console.log(`📦 Found ${premiumShopItems.length} premium items:`, premiumShopItems.map(i => i.name))

    // Find all active premium users
    const premiumUsers = await prisma.user.findMany({
        where: { isPremium: true },
        select: { id: true, name: true },
    })

    console.log(`👑 Found ${premiumUsers.length} premium users`)

    let granted = 0
    let skipped = 0

    for (const user of premiumUsers) {
        for (const shopItem of premiumShopItems) {
            // Check if already owned
            const existing = await prisma.userInventory.findUnique({
                where: { userId_itemId: { userId: user.id, itemId: shopItem.id } },
            })

            if (existing) {
                skipped++
                continue
            }

            // Check if user has any equipped item of same type
            const hasEquipped = await prisma.userInventory.findFirst({
                where: { userId: user.id, isEquipped: true, item: { type: shopItem.type } },
            })

            await prisma.userInventory.create({
                data: {
                    userId: user.id,
                    itemId: shopItem.id,
                    isEquipped: !hasEquipped,
                },
            })

            console.log(`  ✅ Granted "${shopItem.name}" to ${user.name} (equipped: ${!hasEquipped})`)
            granted++
        }
    }

    console.log(`\n🎉 Done! Granted: ${granted}, Skipped (already owned): ${skipped}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
