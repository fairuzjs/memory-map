-- CreateEnum
CREATE TYPE "TopupStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TopupOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "TopupStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopupOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopupOrder_userId_idx" ON "TopupOrder"("userId");

-- CreateIndex
CREATE INDEX "TopupOrder_status_idx" ON "TopupOrder"("status");

-- AddForeignKey
ALTER TABLE "TopupOrder" ADD CONSTRAINT "TopupOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
