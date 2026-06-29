-- CreateEnum
CREATE TYPE "deal_follow_up_type" AS ENUM ('CALL', 'MEETING', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "deal_follow_up_status" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "deal_followups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "deal_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "type" "deal_follow_up_type" NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "reminder_at" TIMESTAMPTZ,
    "owner_user_id" UUID,
    "status" "deal_follow_up_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" UUID,

    CONSTRAINT "deal_followups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_deal_followups_scope_deal_deleted" ON "deal_followups"("tenant_id", "workspace_id", "deal_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_deal_followups_scope_scheduled_deleted" ON "deal_followups"("tenant_id", "workspace_id", "scheduled_at", "deleted_at");

-- AddForeignKey
ALTER TABLE "deal_followups" ADD CONSTRAINT "deal_followups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_followups" ADD CONSTRAINT "deal_followups_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_followups" ADD CONSTRAINT "deal_followups_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_followups" ADD CONSTRAINT "deal_followups_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_followups" ADD CONSTRAINT "deal_followups_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_followups" ADD CONSTRAINT "deal_followups_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_followups" ADD CONSTRAINT "deal_followups_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
