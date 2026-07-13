-- Client Success: renewals, health, contact roles, document folders, merge/origin tracking

CREATE TYPE "client_health_status" AS ENUM ('GREEN', 'YELLOW', 'RED');

CREATE TYPE "client_renewal_type" AS ENUM (
  'HOSTING',
  'SEO',
  'AMC',
  'MAINTENANCE',
  'RETAINER',
  'DOMAIN',
  'SUBSCRIPTION'
);

CREATE TYPE "client_renewal_status" AS ENUM (
  'ACTIVE',
  'UPCOMING',
  'OVERDUE',
  'RENEWED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE "client_document_folder" AS ENUM (
  'CONTRACTS',
  'INVOICES',
  'PROPOSALS',
  'NDA',
  'PURCHASE_ORDERS',
  'DESIGN_FILES',
  'OTHER'
);

ALTER TYPE "client_source" ADD VALUE IF NOT EXISTS 'WON_DEAL';

ALTER TYPE "client_document_type" ADD VALUE IF NOT EXISTS 'NDA';
ALTER TYPE "client_document_type" ADD VALUE IF NOT EXISTS 'PURCHASE_ORDER';
ALTER TYPE "client_document_type" ADD VALUE IF NOT EXISTS 'INVOICE';
ALTER TYPE "client_document_type" ADD VALUE IF NOT EXISTS 'DESIGN_FILE';

ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'CLIENT_MERGED';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'RENEWAL_CREATED';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'RENEWAL_UPDATED';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'RENEWAL_DUE';

ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "origin_deal_id" UUID,
  ADD COLUMN IF NOT EXISTS "merged_into_client_id" UUID,
  ADD COLUMN IF NOT EXISTS "health_status" "client_health_status",
  ADD COLUMN IF NOT EXISTS "health_score" INTEGER,
  ADD COLUMN IF NOT EXISTS "health_calculated_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "idx_clients_scope_health_status"
  ON "clients"("tenant_id", "workspace_id", "health_status");
CREATE INDEX IF NOT EXISTS "idx_clients_scope_origin_deal"
  ON "clients"("tenant_id", "workspace_id", "origin_deal_id");
CREATE INDEX IF NOT EXISTS "idx_clients_scope_merged_into"
  ON "clients"("tenant_id", "workspace_id", "merged_into_client_id");

ALTER TABLE "clients"
  ADD CONSTRAINT "clients_origin_deal_id_fkey"
  FOREIGN KEY ("origin_deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clients"
  ADD CONSTRAINT "clients_merged_into_client_id_fkey"
  FOREIGN KEY ("merged_into_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "client_contacts"
  ADD COLUMN IF NOT EXISTS "role" TEXT,
  ADD COLUMN IF NOT EXISTS "is_finance" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_technical" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_procurement" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "files"
  ADD COLUMN IF NOT EXISTS "folder" "client_document_folder";

CREATE INDEX IF NOT EXISTS "idx_files_scope_entity_folder"
  ON "files"("tenant_id", "workspace_id", "entity_type", "entity_id", "folder");

CREATE TABLE "client_renewals" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "type" "client_renewal_type" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(14, 2),
  "currency" CHAR(3),
  "renewal_date" DATE NOT NULL,
  "reminder_date" DATE,
  "auto_notify" BOOLEAN NOT NULL DEFAULT true,
  "status" "client_renewal_status" NOT NULL DEFAULT 'ACTIVE',
  "reminder_id" UUID,
  "last_notified_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "client_renewals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_client_renewals_tenant_id" ON "client_renewals"("tenant_id");
CREATE INDEX "idx_client_renewals_scope_client"
  ON "client_renewals"("tenant_id", "workspace_id", "client_id", "deleted_at");
CREATE INDEX "idx_client_renewals_scope_renewal_date"
  ON "client_renewals"("tenant_id", "workspace_id", "renewal_date", "deleted_at");
CREATE INDEX "idx_client_renewals_scope_status"
  ON "client_renewals"("tenant_id", "workspace_id", "status", "deleted_at");

ALTER TABLE "client_renewals"
  ADD CONSTRAINT "client_renewals_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_renewals"
  ADD CONSTRAINT "client_renewals_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_renewals"
  ADD CONSTRAINT "client_renewals_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_renewals"
  ADD CONSTRAINT "client_renewals_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_renewals"
  ADD CONSTRAINT "client_renewals_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_renewals"
  ADD CONSTRAINT "client_renewals_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
