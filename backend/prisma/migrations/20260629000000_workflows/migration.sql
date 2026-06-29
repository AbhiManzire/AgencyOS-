-- CreateEnum
CREATE TYPE "workflow_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "workflow_trigger_type" AS ENUM ('CLIENT_CREATED', 'DEAL_WON', 'PROJECT_CREATED', 'TASK_COMPLETED', 'INVOICE_PAID');

-- CreateEnum
CREATE TYPE "workflow_action_type" AS ENUM ('CREATE_TASK', 'SEND_EMAIL', 'SEND_NOTIFICATION', 'UPDATE_STATUS', 'CREATE_ACTIVITY');

-- CreateTable
CREATE TABLE "workflows" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "workflow_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" UUID,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_triggers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "type" "workflow_trigger_type" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workflow_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_actions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "type" "workflow_action_type" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_workflows_scope_status_deleted" ON "workflows"("tenant_id", "workspace_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_workflow_triggers_scope_workflow_sort" ON "workflow_triggers"("tenant_id", "workspace_id", "workflow_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_workflow_triggers_scope_type" ON "workflow_triggers"("tenant_id", "workspace_id", "type");

-- CreateIndex
CREATE INDEX "idx_workflow_actions_scope_workflow_sort" ON "workflow_actions"("tenant_id", "workspace_id", "workflow_id", "sort_order");

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "platform_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_triggers" ADD CONSTRAINT "workflow_triggers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_triggers" ADD CONSTRAINT "workflow_triggers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_triggers" ADD CONSTRAINT "workflow_triggers_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_actions" ADD CONSTRAINT "workflow_actions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
