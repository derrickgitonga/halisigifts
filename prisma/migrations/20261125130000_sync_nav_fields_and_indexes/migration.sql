-- Brings migrations in line with schema.prisma. These columns/indexes may already
-- exist on databases that were synced with `prisma db push`, so every statement is idempotent.

-- AlterTable
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "navLabel" TEXT,
ADD COLUMN IF NOT EXISTS "navOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "showInNav" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
