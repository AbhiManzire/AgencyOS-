-- Sales CRM foundation: lead sources, campaigns, reminders, intake attribution

-- Recreate lead_source enum with the new catalog
CREATE TYPE "lead_source_new" AS ENUM (
  'MANUAL',
  'WEBSITE',
  'META_ADS',
  'GOOGLE_ADS',
  'WHATSAPP',
  'EMAIL',
  'CALL',
  'REFERRAL',
  'IMPORT',
  'API',
  'WEBHOOK'
);

ALTER TABLE "leads" ALTER COLUMN "source" DROP DEFAULT;

ALTER TABLE "leads"
  ALTER COLUMN "source" TYPE "lead_source_new"
  USING (
    CASE "source"::text
      WHEN 'WEBSITE' THEN 'WEBSITE'
      WHEN 'REFERRAL' THEN 'REFERRAL'
      WHEN 'COLD_OUTREACH' THEN 'CALL'
      WHEN 'SOCIAL' THEN 'META_ADS'
      WHEN 'EVENT' THEN 'MANUAL'
      WHEN 'PARTNER' THEN 'REFERRAL'
      WHEN 'OTHER' THEN 'MANUAL'
      ELSE 'MANUAL'
    END::"lead_source_new"
  );

DROP TYPE "lead_source";
ALTER TYPE "lead_source_new" RENAME TO "lead_source";

ALTER TABLE "leads" ALTER COLUMN "source" SET DEFAULT 'MANUAL'::"lead_source";

CREATE TYPE "sales_campaign_status" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED'
);

CREATE TABLE "sales_campaigns" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "status" "sales_campaign_status" NOT NULL DEFAULT 'DRAFT',
  "starts_at" TIMESTAMPTZ,
  "ends_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,

  CONSTRAINT "sales_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_sales_campaigns_tenant_id_workspace_id_code"
  ON "sales_campaigns"("tenant_id", "workspace_id", "code");

CREATE INDEX "idx_sales_campaigns_tenant_id" ON "sales_campaigns"("tenant_id");
CREATE INDEX "idx_sales_campaigns_scope_status" ON "sales_campaigns"("tenant_id", "workspace_id", "status");
CREATE INDEX "idx_sales_campaigns_scope_deleted_at" ON "sales_campaigns"("tenant_id", "workspace_id", "deleted_at");

ALTER TABLE "sales_campaigns"
  ADD CONSTRAINT "sales_campaigns_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_campaigns"
  ADD CONSTRAINT "sales_campaigns_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_campaigns"
  ADD CONSTRAINT "sales_campaigns_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_campaigns"
  ADD CONSTRAINT "sales_campaigns_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_campaigns"
  ADD CONSTRAINT "sales_campaigns_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TYPE "reminder_recurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "reminder_status" AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'COMPLETED');

CREATE TABLE "reminders" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "remind_date" DATE NOT NULL,
  "remind_time" VARCHAR(5) NOT NULL,
  "remind_at" TIMESTAMPTZ NOT NULL,
  "recurrence" "reminder_recurrence" NOT NULL DEFAULT 'NONE',
  "assigned_user_id" UUID NOT NULL,
  "notification_event_key" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" UUID,
  "status" "reminder_status" NOT NULL DEFAULT 'PENDING',
  "last_fired_at" TIMESTAMPTZ,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,

  CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_reminders_tenant_id" ON "reminders"("tenant_id");
CREATE INDEX "idx_reminders_scope_status_remind_at" ON "reminders"("tenant_id", "workspace_id", "status", "remind_at");
CREATE INDEX "idx_reminders_scope_assignee_deleted" ON "reminders"("tenant_id", "workspace_id", "assigned_user_id", "deleted_at");
CREATE INDEX "idx_reminders_scope_entity" ON "reminders"("tenant_id", "workspace_id", "entity_type", "entity_id");

ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reminders"
  ADD CONSTRAINT "reminders_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads" ADD COLUMN "campaign_id" UUID;
ALTER TABLE "leads" ADD COLUMN "intake_provider" TEXT;
ALTER TABLE "leads" ADD COLUMN "external_id" TEXT;

CREATE UNIQUE INDEX "uq_leads_scope_intake_external"
  ON "leads"("tenant_id", "workspace_id", "intake_provider", "external_id");

CREATE INDEX "idx_leads_tenant_id_workspace_id_campaign_id"
  ON "leads"("tenant_id", "workspace_id", "campaign_id");

CREATE INDEX "idx_leads_tenant_id_workspace_id_email"
  ON "leads"("tenant_id", "workspace_id", "email");

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "sales_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
