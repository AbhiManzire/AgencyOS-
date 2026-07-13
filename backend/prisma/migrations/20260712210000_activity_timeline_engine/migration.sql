-- Activity & Timeline Engine: typed activities, origin, dedupe, polymorphic follow-ups

CREATE TYPE "activity_type" AS ENUM (
  'LEAD_CREATED',
  'LEAD_UPDATED',
  'OWNER_CHANGED',
  'CALL',
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'MEETING',
  'NOTE',
  'TASK',
  'FOLLOW_UP',
  'PROPOSAL_SENT',
  'QUOTE_SENT',
  'INVOICE_SENT',
  'PAYMENT_RECEIVED',
  'REMINDER',
  'STATUS_CHANGED',
  'PIPELINE_CHANGED',
  'TAG_ADDED',
  'ATTACHMENT_UPLOADED',
  'DOCUMENT_SHARED',
  'DEAL_WON',
  'DEAL_LOST',
  'CLIENT_CONVERTED',
  'PROJECT_CREATED',
  'CUSTOM'
);

CREATE TYPE "activity_origin" AS ENUM ('SYSTEM', 'MANUAL');

ALTER TABLE "activities" ADD COLUMN "origin" "activity_origin" NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "activities" ADD COLUMN "dedupe_key" TEXT;
ALTER TABLE "activities" ADD COLUMN "type_new" "activity_type";

UPDATE "activities"
SET "type_new" = CASE "type"
  WHEN 'lead.created' THEN 'LEAD_CREATED'::"activity_type"
  WHEN 'lead.imported' THEN 'LEAD_CREATED'::"activity_type"
  WHEN 'lead.updated' THEN 'LEAD_UPDATED'::"activity_type"
  WHEN 'lead.status_changed' THEN 'STATUS_CHANGED'::"activity_type"
  WHEN 'lead.converted' THEN 'CLIENT_CONVERTED'::"activity_type"
  WHEN 'lead.tag_assigned' THEN 'TAG_ADDED'::"activity_type"
  WHEN 'deal.won' THEN 'DEAL_WON'::"activity_type"
  WHEN 'deal.lost' THEN 'DEAL_LOST'::"activity_type"
  WHEN 'deal.stage_changed' THEN 'PIPELINE_CHANGED'::"activity_type"
  WHEN 'deal.assigned' THEN 'OWNER_CHANGED'::"activity_type"
  WHEN 'quote.sent' THEN 'QUOTE_SENT'::"activity_type"
  WHEN 'proposal.sent' THEN 'PROPOSAL_SENT'::"activity_type"
  WHEN 'invoice.sent' THEN 'INVOICE_SENT'::"activity_type"
  WHEN 'invoice.email.sent' THEN 'INVOICE_SENT'::"activity_type"
  WHEN 'payment.received' THEN 'PAYMENT_RECEIVED'::"activity_type"
  WHEN 'project.created' THEN 'PROJECT_CREATED'::"activity_type"
  WHEN 'client.created' THEN 'CUSTOM'::"activity_type"
  WHEN 'task.created' THEN 'TASK'::"activity_type"
  WHEN 'task.updated' THEN 'TASK'::"activity_type"
  WHEN 'task.completed' THEN 'TASK'::"activity_type"
  ELSE 'CUSTOM'::"activity_type"
END;

ALTER TABLE "activities" ALTER COLUMN "type_new" SET NOT NULL;
ALTER TABLE "activities" DROP COLUMN "type";
ALTER TABLE "activities" RENAME COLUMN "type_new" TO "type";

CREATE UNIQUE INDEX "uq_activities_scope_dedupe_key"
  ON "activities"("tenant_id", "workspace_id", "dedupe_key");

CREATE INDEX "idx_activities_tenant_id_workspace_id_type"
  ON "activities"("tenant_id", "workspace_id", "type");

CREATE INDEX "idx_activities_tenant_id_workspace_id_origin"
  ON "activities"("tenant_id", "workspace_id", "origin");

CREATE INDEX "idx_activities_tenant_id_workspace_id_user_id"
  ON "activities"("tenant_id", "workspace_id", "user_id");

CREATE TYPE "follow_up_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "follow_up_reminder_type" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'FOLLOW_UP', 'CUSTOM');
CREATE TYPE "follow_up_status" AS ENUM ('PENDING', 'COMPLETED', 'MISSED', 'CANCELLED');
CREATE TYPE "follow_up_recurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

CREATE TABLE "follow_ups" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "follow_up_date" DATE NOT NULL,
  "follow_up_time" VARCHAR(5) NOT NULL,
  "scheduled_at" TIMESTAMPTZ NOT NULL,
  "priority" "follow_up_priority" NOT NULL DEFAULT 'MEDIUM',
  "assigned_user_id" UUID NOT NULL,
  "reminder_type" "follow_up_reminder_type" NOT NULL,
  "status" "follow_up_status" NOT NULL DEFAULT 'PENDING',
  "recurrence" "follow_up_recurrence" NOT NULL DEFAULT 'NONE',
  "completed_at" TIMESTAMPTZ,
  "missed_at" TIMESTAMPTZ,
  "activity_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,

  CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_follow_ups_tenant_id" ON "follow_ups"("tenant_id");
CREATE INDEX "idx_follow_ups_scope_status_scheduled"
  ON "follow_ups"("tenant_id", "workspace_id", "status", "scheduled_at");
CREATE INDEX "idx_follow_ups_scope_assignee_deleted"
  ON "follow_ups"("tenant_id", "workspace_id", "assigned_user_id", "deleted_at");
CREATE INDEX "idx_follow_ups_scope_entity"
  ON "follow_ups"("tenant_id", "workspace_id", "entity_type", "entity_id");

ALTER TABLE "follow_ups"
  ADD CONSTRAINT "follow_ups_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "follow_ups"
  ADD CONSTRAINT "follow_ups_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "follow_ups"
  ADD CONSTRAINT "follow_ups_assigned_user_id_fkey"
  FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "follow_ups"
  ADD CONSTRAINT "follow_ups_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "follow_ups"
  ADD CONSTRAINT "follow_ups_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "follow_ups"
  ADD CONSTRAINT "follow_ups_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
