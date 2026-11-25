-- Customer-facing sequential order numbers (shown as HG-10001, HG-10002, ...)

CREATE SEQUENCE "Order_orderNumber_seq" START WITH 10001;

ALTER TABLE "Order" ADD COLUMN "orderNumber" INTEGER;

-- Number existing orders oldest-first, starting at 10001
UPDATE "Order" AS o
SET "orderNumber" = numbered.n
FROM (
  SELECT "id", 10000 + ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS n
  FROM "Order"
) AS numbered
WHERE o."id" = numbered."id";

-- Continue the sequence after the highest existing number
SELECT setval('"Order_orderNumber_seq"', GREATEST(COALESCE((SELECT MAX("orderNumber") FROM "Order"), 10000), 10000));

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET DEFAULT nextval('"Order_orderNumber_seq"');
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER SEQUENCE "Order_orderNumber_seq" OWNED BY "Order"."orderNumber";

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
