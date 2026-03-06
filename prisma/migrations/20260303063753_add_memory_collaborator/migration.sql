-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'COLLABORATION_INVITE';

-- CreateTable
CREATE TABLE "MemoryCollaborator" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "CollaboratorStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryCollaborator_memory_id_idx" ON "MemoryCollaborator"("memory_id");

-- CreateIndex
CREATE INDEX "MemoryCollaborator_user_id_idx" ON "MemoryCollaborator"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryCollaborator_memory_id_user_id_key" ON "MemoryCollaborator"("memory_id", "user_id");

-- AddForeignKey
ALTER TABLE "MemoryCollaborator" ADD CONSTRAINT "MemoryCollaborator_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryCollaborator" ADD CONSTRAINT "MemoryCollaborator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
