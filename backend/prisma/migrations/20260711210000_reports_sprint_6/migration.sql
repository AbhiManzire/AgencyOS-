-- Sprint 6: scheduled reports + analytics query indexes

CREATE TYPE "scheduled_report_frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "scheduled_report_export_format" AS ENUM ('CSV', 'PDF', 'XLSX');
CREATE TYPE "scheduled_report_run_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "scheduled_reports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "frequency" "scheduled_report_frequency" NOT NULL,
    "export_format" "scheduled_report_export_format" NOT NULL DEFAULT 'CSV',
    "recipient_emails" TEXT[],
    "filters" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "next_run_at" TIMESTAMPTZ NOT NULL,
    "last_run_at" TIMESTAMPTZ,
    "last_status" "scheduled_report_run_status",
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" UUID,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_scheduled_reports_scope_deleted" ON "scheduled_reports"("tenant_id", "workspace_id", "deleted_at");
CREATE INDEX "idx_scheduled_reports_scope_active_next" ON "scheduled_reports"("tenant_id", "workspace_id", "is_active", "next_run_at", "deleted_at");

ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_payments_scope_status_paid_at" ON "payments"("tenant_id", "workspace_id", "status", "paid_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_expenses_scope_date_approval" ON "expenses"("tenant_id", "workspace_id", "expense_date", "approval_status") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_invoices_scope_issue_status" ON "invoices"("tenant_id", "workspace_id", "issue_date", "status") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_clients_scope_became_client" ON "clients"("tenant_id", "workspace_id", "became_client_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_deals_scope_stage_won_at" ON "deals"("tenant_id", "workspace_id", "stage", "won_at") WHERE "deleted_at" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_time_entries_scope_start" ON "time_entries"("tenant_id", "workspace_id", "start_time") WHERE "deleted_at" IS NULL;
