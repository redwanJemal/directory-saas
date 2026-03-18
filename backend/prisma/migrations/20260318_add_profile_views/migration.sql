-- CreateTable
CREATE TABLE IF NOT EXISTS "profile_views" (
    "id" UUID NOT NULL,
    "provider_profile_id" UUID NOT NULL,
    "client_user_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "profile_views_provider_profile_id_created_at_idx" ON "profile_views"("provider_profile_id", "created_at");

-- AddForeignKey
ALTER TABLE "profile_views" DROP CONSTRAINT IF EXISTS "profile_views_provider_profile_id_fkey";
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_provider_profile_id_fkey" FOREIGN KEY ("provider_profile_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
