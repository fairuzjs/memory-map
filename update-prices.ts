import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("Discounting all items by 50%...")
    const items = await prisma.shopItem.findMany()
    for (const item of items) {
        // ensure minimum price is 1
        const newPrice = Math.max(1, Math.floor(item.price / 2))
        await prisma.shopItem.update({
            where: { id: item.id },
            data: { price: newPrice }
        })
        console.log(`Updated ${item.name}: ${item.price} -> ${newPrice}`)
    }
    console.log("All shop items successfully discounted by 50%!")
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })
