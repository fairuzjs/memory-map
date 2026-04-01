import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const baseInclude = {
            user: { select: { id: true, name: true, image: true } },
            photos: true,
            _count: { select: { reactions: true, comments: true } }
        }
        
        const memories = await prisma.memory.findMany({
            where: { isPublic: true },
            include: baseInclude,
            orderBy: { date: "desc" }
        })
        console.log("Success! Found memories:", memories.length)
    } catch (e) {
        console.error("Prisma error:", e)
    } finally {
        await prisma.$disconnect()
    }
}
main()
