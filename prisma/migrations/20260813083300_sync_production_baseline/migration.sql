-- 1. Create Enum CartStatus idempotently
DO $$ BEGIN
    CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'ABANDONED', 'RECOVERED', 'CONVERTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter CartItem: Add cartSessionId column
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "cartSessionId" TEXT;

-- 3. Alter Order: Add split and discount columns
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "engravingFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountDueNow" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "amountDueOnDelivery" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 4. Alter Product: Add columns idempotently and set default
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceMax" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceMin" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "statusNote" TEXT;
ALTER TABLE "Product" ALTER COLUMN "price" SET DEFAULT 0.00;

-- 5. Alter ProductVariant: Add image column idempotently
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- 6. Create CartSession table idempotently
CREATE TABLE IF NOT EXISTS "CartSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "customerName" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "abandonedAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "recoveryToken" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,

    CONSTRAINT "CartSession_pkey" PRIMARY KEY ("id")
);

-- 7. Create Indexes idempotently
CREATE UNIQUE INDEX IF NOT EXISTS "CartSession_sessionToken_key" ON "CartSession"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "CartSession_recoveryToken_key" ON "CartSession"("recoveryToken");
CREATE UNIQUE INDEX IF NOT EXISTS "CartSession_orderId_key" ON "CartSession"("orderId");
CREATE INDEX IF NOT EXISTS "CartSession_status_reminderCount_lastActiveAt_idx" ON "CartSession"("status", "reminderCount", "lastActiveAt");
CREATE INDEX IF NOT EXISTS "CartSession_email_idx" ON "CartSession"("email");
CREATE INDEX IF NOT EXISTS "CartItem_sessionOrUserId_idx" ON "CartItem"("sessionOrUserId");
CREATE INDEX IF NOT EXISTS "CartItem_cartSessionId_idx" ON "CartItem"("cartSessionId");
CREATE INDEX IF NOT EXISTS "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isActive_isFeatured_idx" ON "Product"("isActive", "isFeatured");
CREATE INDEX IF NOT EXISTS "Product_isActive_isNew_idx" ON "Product"("isActive", "isNew");
CREATE INDEX IF NOT EXISTS "Product_isActive_isHotDeal_idx" ON "Product"("isActive", "isHotDeal");

-- 8. Add Foreign Keys idempotently
DO $$ BEGIN
    ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartSessionId_fkey" FOREIGN KEY ("cartSessionId") REFERENCES "CartSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CartSession" ADD CONSTRAINT "CartSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CartSession" ADD CONSTRAINT "CartSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
