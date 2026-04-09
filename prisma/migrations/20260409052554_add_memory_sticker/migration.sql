-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'MEMORY_STICKER';

-- CreateTable
CREATE TABLE "MemoryStickerPlacement" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "zIndex" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryStickerPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryStickerPlacement_memory_id_idx" ON "MemoryStickerPlacement"("memory_id");

-- CreateIndex
CREATE INDEX "MemoryStickerPlacement_user_id_idx" ON "MemoryStickerPlacement"("user_id");

-- AddForeignKey
ALTER TABLE "MemoryStickerPlacement" ADD CONSTRAINT "MemoryStickerPlacement_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryStickerPlacement" ADD CONSTRAINT "MemoryStickerPlacement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryStickerPlacement" ADD CONSTRAINT "MemoryStickerPlacement_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "ShopItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
