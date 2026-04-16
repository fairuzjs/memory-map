import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const oldNames = ["Perangko Langit", "Diary Pita Emas", "Jurnal Lavender", "Playlist Senja"]
    console.log("Removing old items...")
    const res = await prisma.shopItem.deleteMany({
        where: { name: { in: oldNames } }
    })
    console.log(`Removed ${res.count} items.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
