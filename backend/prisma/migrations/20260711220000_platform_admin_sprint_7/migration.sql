-- Sprint 7: Platform Administration

-- Agency branding / address / tax
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "address_line_1" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "address_line_2" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "state_region" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "country_code" CHAR(2);
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "gstin" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "pan" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "brand_primary_color" TEXT;
ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "brand_secondary_color" TEXT;

-- Workspace profile + preferences
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "address_line_1" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "address_line_2" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "state_region" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "country_code" CHAR(2);
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "gstin" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "pan" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "financial_year_start_month" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "business_hours_start" TEXT NOT NULL DEFAULT '09:00';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "business_hours_end" TEXT NOT NULL DEFAULT '18:00';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "working_days" JSONB NOT NULL DEFAULT '[1,2,3,4,5]';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "number_format" TEXT NOT NULL DEFAULT 'en-US';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "preferences_json" JSONB NOT NULL DEFAULT '{}';

-- User security / profile
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMPTZ;

-- Employee manager
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "manager_user_id" UUID;
CREATE INDEX IF NOT EXISTS "idx_employees_tenant_id_manager_user_id" ON "employees"("tenant_id", "manager_user_id");
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_manager_user_id_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Audit logs
CREATE TYPE "audit_action" AS ENUM (
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE',
  'PERMISSION_CHANGE', 'ROLE_CHANGE', 'SETTINGS_CHANGE', 'FINANCE_CHANGE',
  'SALES_CHANGE', 'PROJECT_CHANGE', 'TASK_CHANGE', 'USER_CHANGE', 'SECURITY_CHANGE', 'OTHER'
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "action" "audit_action" NOT NULL,
  "category" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" UUID,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "occurred_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_audit_logs_scope_occurred" ON "audit_logs"("tenant_id", "workspace_id", "occurred_at");
CREATE INDEX "idx_audit_logs_scope_action_occurred" ON "audit_logs"("tenant_id", "workspace_id", "action", "occurred_at");
CREATE INDEX "idx_audit_logs_scope_actor_occurred" ON "audit_logs"("tenant_id", "workspace_id", "actor_user_id", "occurred_at");
CREATE INDEX "idx_audit_logs_scope_category_occurred" ON "audit_logs"("tenant_id", "workspace_id", "category", "occurred_at");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notifications
CREATE TYPE "notification_category" AS ENUM ('TASK', 'PROJECT', 'FINANCE', 'SALES', 'CLIENT', 'SYSTEM');
CREATE TYPE "notification_priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "recipient_user_id" UUID NOT NULL,
  "category" "notification_category" NOT NULL,
  "priority" "notification_priority" NOT NULL DEFAULT 'NORMAL',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" UUID,
  "link_path" TEXT,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMPTZ,
  "email_ready" BOOLEAN NOT NULL DEFAULT false,
  "email_sent_at" TIMESTAMPTZ,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_notifications_scope_recipient_read" ON "notifications"("tenant_id", "workspace_id", "recipient_user_id", "is_read", "deleted_at");
CREATE INDEX "idx_notifications_scope_recipient_created" ON "notifications"("tenant_id", "workspace_id", "recipient_user_id", "created_at");
CREATE INDEX "idx_notifications_scope_category" ON "notifications"("tenant_id", "workspace_id", "category", "deleted_at");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Invitations
CREATE TYPE "invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

CREATE TABLE "user_invitations" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role_id" UUID,
  "invited_by_user_id" UUID,
  "token_hash" TEXT NOT NULL,
  "status" "invitation_status" NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMPTZ NOT NULL,
  "accepted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_user_invitations_scope_status" ON "user_invitations"("tenant_id", "workspace_id", "status", "deleted_at");
CREATE INDEX "idx_user_invitations_scope_email" ON "user_invitations"("tenant_id", "workspace_id", "email", "deleted_at");
CREATE UNIQUE INDEX "uq_user_invitations_scope_token_hash" ON "user_invitations"("tenant_id", "workspace_id", "token_hash");

ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Personal access tokens
CREATE TABLE "personal_access_tokens" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "token_prefix" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "last_used_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "revoked_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "personal_access_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_personal_access_tokens_scope_user" ON "personal_access_tokens"("tenant_id", "workspace_id", "user_id", "deleted_at");
CREATE UNIQUE INDEX "uq_personal_access_tokens_token_hash" ON "personal_access_tokens"("token_hash");

ALTER TABLE "personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
