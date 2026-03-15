-- CreateTable
CREATE TABLE "domain_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "domain_events_type_created_at_idx" ON "domain_events"("type", "created_at");

-- CreateIndex
CREATE INDEX "domain_events_tenant_id_created_at_idx" ON "domain_events"("tenant_id", "created_at");
