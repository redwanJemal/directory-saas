-- AlterTable
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "color" TEXT,
ADD COLUMN IF NOT EXISTS "icon" TEXT;

-- AlterTable
ALTER TABLE "provider_profiles" ADD COLUMN IF NOT EXISTS "business_hours" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "instagram" TEXT,
ADD COLUMN IF NOT EXISTS "tiktok" TEXT,
ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "provider_categories" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "deals" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount_percent" INTEGER,
    "original_price" DECIMAL(12,2),
    "deal_price" DECIMAL(12,2),
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "provider_categories_category_id_idx" ON "provider_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "provider_categories_provider_profile_id_category_id_key" ON "provider_categories"("provider_profile_id", "category_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "deals_provider_profile_id_idx" ON "deals"("provider_profile_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "deals_is_active_expires_at_idx" ON "deals"("is_active", "expires_at");

-- AddForeignKey
ALTER TABLE "provider_categories" DROP CONSTRAINT IF EXISTS "provider_categories_provider_profile_id_fkey";
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_categories" DROP CONSTRAINT IF EXISTS "provider_categories_category_id_fkey";
ALTER TABLE "provider_categories" ADD CONSTRAINT "provider_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" DROP CONSTRAINT IF EXISTS "deals_provider_profile_id_fkey";
ALTER TABLE "deals" ADD CONSTRAINT "deals_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
