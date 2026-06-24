const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: 'dndraaa219@gmail.com' },
    data: { isEmailVerified: true }
  });
  console.log("User verified!");
}

main().finally(() => prisma.$disconnect());
