-- CreateEnum
CREATE TYPE "proposal_status" AS ENUM ('DRAFT', 'REVIEW', 'SENT', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "deal_id" UUID NOT NULL,
    "quote_id" UUID,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "proposal_status" NOT NULL DEFAULT 'DRAFT',
    "sections" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" UUID,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_versions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "proposal_status" NOT NULL,
    "sections" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "created_by_user_id" UUID,

    CONSTRAINT "proposal_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_proposals_scope_deal_deleted" ON "proposals"("tenant_id", "workspace_id", "deal_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_proposals_scope_quote_deleted" ON "proposals"("tenant_id", "workspace_id", "quote_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_proposals_scope_status_deleted" ON "proposals"("tenant_id", "workspace_id", "status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_proposal_versions_proposal_version" ON "proposal_versions"("proposal_id", "version");

-- CreateIndex
CREATE INDEX "idx_proposal_versions_scope_proposal" ON "proposal_versions"("tenant_id", "workspace_id", "proposal_id");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
