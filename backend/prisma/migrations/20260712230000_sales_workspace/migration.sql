-- Sales Workspace: sales_tasks for My Work queue/calendar/tasks

CREATE TYPE "sales_task_type" AS ENUM (
  'CALL',
  'MEETING',
  'EMAIL',
  'WHATSAPP',
  'PROPOSAL',
  'DOCUMENTATION',
  'INTERNAL',
  'CUSTOM'
);

CREATE TYPE "sales_task_status" AS ENUM (
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE'
);

CREATE TYPE "sales_task_priority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TABLE "sales_tasks" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "type" "sales_task_type" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "owner_user_id" UUID NOT NULL,
  "due_date" DATE NOT NULL,
  "due_time" VARCHAR(5),
  "due_at" TIMESTAMPTZ NOT NULL,
  "priority" "sales_task_priority" NOT NULL DEFAULT 'MEDIUM',
  "lead_id" UUID,
  "deal_id" UUID,
  "client_id" UUID,
  "status" "sales_task_status" NOT NULL DEFAULT 'PENDING',
  "completed_at" TIMESTAMPTZ,
  "cancelled_at" TIMESTAMPTZ,
  "activity_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "sales_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_sales_tasks_tenant_id" ON "sales_tasks"("tenant_id");
CREATE INDEX "idx_sales_tasks_scope_owner_status_due"
  ON "sales_tasks"("tenant_id", "workspace_id", "owner_user_id", "status", "due_at");
CREATE INDEX "idx_sales_tasks_scope_due"
  ON "sales_tasks"("tenant_id", "workspace_id", "due_at", "deleted_at");
CREATE INDEX "idx_sales_tasks_scope_lead"
  ON "sales_tasks"("tenant_id", "workspace_id", "lead_id");
CREATE INDEX "idx_sales_tasks_scope_deal"
  ON "sales_tasks"("tenant_id", "workspace_id", "deal_id");
CREATE INDEX "idx_sales_tasks_scope_client"
  ON "sales_tasks"("tenant_id", "workspace_id", "client_id");

ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_tasks"
  ADD CONSTRAINT "sales_tasks_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
