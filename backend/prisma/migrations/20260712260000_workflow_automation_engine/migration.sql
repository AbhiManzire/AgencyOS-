-- Workflow Automation Engine: expanded triggers/actions/conditions, delay, version, execution metadata

-- Trigger types (keep existing values; add new)
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'LEAD_CREATED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'LEAD_UPDATED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'LEAD_ASSIGNED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'LEAD_QUALIFIED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'LEAD_CONVERTED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'DEAL_CREATED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'DEAL_STAGE_CHANGED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'DEAL_LOST';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'INVOICE_CREATED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'PAYMENT_RECEIVED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'REMINDER_DUE';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'REMINDER_OVERDUE';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'DOCUMENT_UPLOADED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'USER_CREATED';
ALTER TYPE "workflow_trigger_type" ADD VALUE IF NOT EXISTS 'CUSTOM_EVENT';

-- Action types
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'ASSIGN_OWNER';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'CHANGE_STATUS';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'CREATE_REMINDER';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'CREATE_NOTIFICATION';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'SEND_WHATSAPP';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'CREATE_PROJECT';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'CREATE_INVOICE';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'ADD_TAGS';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'UPDATE_FIELD';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'CALL_WEBHOOK';
ALTER TYPE "workflow_action_type" ADD VALUE IF NOT EXISTS 'RUN_INTERNAL_ACTION';

CREATE TYPE "workflow_action_delay_type" AS ENUM (
  'IMMEDIATE',
  'MINUTES',
  'HOURS',
  'DAYS',
  'SPECIFIC_DATE',
  'RECURRING'
);

CREATE TYPE "workflow_condition_logic" AS ENUM ('AND', 'OR');

CREATE TYPE "workflow_condition_node_type" AS ENUM ('CONDITION', 'GROUP');

ALTER TYPE "workflow_condition_operator" ADD VALUE IF NOT EXISTS 'STARTS_WITH';
ALTER TYPE "workflow_condition_operator" ADD VALUE IF NOT EXISTS 'ENDS_WITH';
ALTER TYPE "workflow_condition_operator" ADD VALUE IF NOT EXISTS 'BETWEEN';
ALTER TYPE "workflow_condition_operator" ADD VALUE IF NOT EXISTS 'EMPTY';
ALTER TYPE "workflow_condition_operator" ADD VALUE IF NOT EXISTS 'NOT_EMPTY';

ALTER TABLE "workflows"
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "is_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "idx_workflows_scope_enabled_deleted"
  ON "workflows"("tenant_id", "workspace_id", "is_enabled", "deleted_at");

ALTER TABLE "workflow_triggers"
  ADD COLUMN IF NOT EXISTS "config" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "workflow_actions"
  ADD COLUMN IF NOT EXISTS "delay_type" "workflow_action_delay_type" NOT NULL DEFAULT 'IMMEDIATE',
  ADD COLUMN IF NOT EXISTS "delay_value" INTEGER,
  ADD COLUMN IF NOT EXISTS "delay_until" TIMESTAMPTZ;

ALTER TABLE "workflow_conditions"
  ALTER COLUMN "field" DROP NOT NULL,
  ALTER COLUMN "operator" DROP NOT NULL;

ALTER TABLE "workflow_conditions"
  ADD COLUMN IF NOT EXISTS "parent_id" UUID,
  ADD COLUMN IF NOT EXISTS "node_type" "workflow_condition_node_type" NOT NULL DEFAULT 'CONDITION',
  ADD COLUMN IF NOT EXISTS "logic" "workflow_condition_logic" NOT NULL DEFAULT 'AND';

CREATE INDEX IF NOT EXISTS "idx_workflow_conditions_scope_parent"
  ON "workflow_conditions"("tenant_id", "workspace_id", "parent_id");

ALTER TABLE "workflow_conditions"
  ADD CONSTRAINT "workflow_conditions_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "workflow_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_executions"
  ADD COLUMN IF NOT EXISTS "record_entity_type" TEXT,
  ADD COLUMN IF NOT EXISTS "record_entity_id" UUID,
  ADD COLUMN IF NOT EXISTS "retry_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "scheduled_for" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "duration_ms" INTEGER,
  ADD COLUMN IF NOT EXISTS "result" JSONB;

CREATE INDEX IF NOT EXISTS "idx_workflow_executions_scope_status_scheduled"
  ON "workflow_executions"("tenant_id", "workspace_id", "status", "scheduled_for");
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_scope_record"
  ON "workflow_executions"("tenant_id", "workspace_id", "record_entity_type", "record_entity_id");
