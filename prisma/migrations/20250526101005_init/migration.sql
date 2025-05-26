-- AlterTable
ALTER TABLE "products" ADD COLUMN     "aiMessage" TEXT,
ADD COLUMN     "aiStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "aiVerifiedAt" TIMESTAMP(3);
