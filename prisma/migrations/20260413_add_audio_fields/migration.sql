-- AlterTable
ALTER TABLE "Memory" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "audioBucket" TEXT,
ADD COLUMN     "audioPath" TEXT,
ADD COLUMN     "audioStartTime" DOUBLE PRECISION,
ADD COLUMN     "audioDuration" INTEGER,
ADD COLUMN     "audioFileName" TEXT;
