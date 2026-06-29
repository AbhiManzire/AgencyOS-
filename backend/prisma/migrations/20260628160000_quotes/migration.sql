-- CreateEnum
CREATE TYPE "quote_status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "deal_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "quote_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "quote_status" NOT NULL DEFAULT 'DRAFT',
    "valid_until" DATE,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "total_amount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" UUID,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_quotes_scope_quote_number" ON "quotes"("tenant_id", "workspace_id", "quote_number");

-- CreateIndex
CREATE INDEX "idx_quotes_scope_deal_deleted" ON "quotes"("tenant_id", "workspace_id", "deal_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_quotes_scope_client_deleted" ON "quotes"("tenant_id", "workspace_id", "client_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_quotes_scope_status_deleted" ON "quotes"("tenant_id", "workspace_id", "status", "deleted_at");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
