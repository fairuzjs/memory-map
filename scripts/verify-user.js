const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/verify-user.js <email>');
    process.exit(1);
  }

  const result = await prisma.user.updateMany({
    where: { email },
    data: { isEmailVerified: true },
  });

  if (result.count === 0) {
    console.log(`No user found with email: ${email}`);
  } else {
    console.log(`User verified: ${email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
