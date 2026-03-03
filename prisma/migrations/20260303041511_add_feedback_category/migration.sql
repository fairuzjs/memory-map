/*
  Warnings:

  - The primary key for the `_MemoryToTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_MemoryToTag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMENT', 'REACTION', 'REPLY');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('SUGGESTION', 'BUG', 'QUESTION', 'OTHER');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "category" "FeedbackCategory" NOT NULL DEFAULT 'SUGGESTION';

-- AlterTable
ALTER TABLE "_MemoryToTag" DROP CONSTRAINT "_MemoryToTag_AB_pkey";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "memory_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_actor_id_idx" ON "Notification"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "_MemoryToTag_AB_unique" ON "_MemoryToTag"("A", "B");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
