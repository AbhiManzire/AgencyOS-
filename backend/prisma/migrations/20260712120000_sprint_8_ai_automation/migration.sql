-- Sprint 8: AI infrastructure + automation engine foundation

-- AlterEnum AuditAction
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'AI_CHANGE';
ALTER TYPE "audit_action" ADD VALUE IF NOT EXISTS 'AUTOMATION_CHANGE';

-- AlterTable workflow_actions (retry support)
ALTER TABLE "workflow_actions" ADD COLUMN IF NOT EXISTS "max_retries" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "workflow_actions" ADD COLUMN IF NOT EXISTS "retry_delay_ms" INTEGER NOT NULL DEFAULT 1000;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "workflow_condition_operator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'IS_SET', 'IS_NOT_SET');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "workflow_schedule_frequency" AS ENUM ('ONCE', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'CRON');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "workflow_execution_status" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'RETRYING', 'CANCELLED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "workflow_execution_log_level" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ai_provider_kind" AS ENUM ('NULL', 'OPENAI', 'ANTHROPIC', 'AZURE_OPENAI', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ai_conversation_status" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ai_message_role" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Workflow conditions
CREATE TABLE IF NOT EXISTS "workflow_conditions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "operator" "workflow_condition_operator" NOT NULL,
    "value" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "workflow_conditions_pkey" PRIMARY KEY ("id")
);

-- Workflow schedules
CREATE TABLE IF NOT EXISTS "workflow_schedules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "frequency" "workflow_schedule_frequency" NOT NULL,
    "cron_expression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "next_run_at" TIMESTAMPTZ,
    "last_run_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "workflow_schedules_pkey" PRIMARY KEY ("id")
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS "workflow_executions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "status" "workflow_execution_status" NOT NULL DEFAULT 'PENDING',
    "trigger_type" TEXT,
    "trigger_payload" JSONB,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "finished_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "triggered_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS "workflow_execution_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "execution_id" UUID NOT NULL,
    "level" "workflow_execution_log_level" NOT NULL DEFAULT 'INFO',
    "step_key" TEXT,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "workflow_execution_logs_pkey" PRIMARY KEY ("id")
);

-- Feature flags
CREATE TABLE IF NOT EXISTS "feature_flags" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- AI provider configs
CREATE TABLE IF NOT EXISTS "ai_provider_configs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "kind" "ai_provider_kind" NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "base_url" TEXT,
    "model" TEXT,
    "api_key_env_ref" TEXT,
    "encrypted_api_key" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);

-- AI prompt templates
CREATE TABLE IF NOT EXISTS "ai_prompt_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "system_prompt" TEXT NOT NULL,
    "user_prompt_template" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "ai_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- AI conversations
CREATE TABLE IF NOT EXISTS "ai_conversations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "title" TEXT,
    "status" "ai_conversation_status" NOT NULL DEFAULT 'ACTIVE',
    "provider_kind" "ai_provider_kind",
    "model" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- AI messages
CREATE TABLE IF NOT EXISTS "ai_messages" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "ai_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER,
    "created_by_user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- AI usage events
CREATE TABLE IF NOT EXISTS "ai_usage_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "conversation_id" UUID,
    "actor_user_id" UUID,
    "provider_kind" "ai_provider_kind" NOT NULL,
    "model" TEXT,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6),
    "feature_key" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);

-- AI settings
CREATE TABLE IF NOT EXISTS "ai_settings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "default_provider_kind" "ai_provider_kind",
    "default_model" TEXT,
    "max_tokens_per_request" INTEGER NOT NULL DEFAULT 4096,
    "monthly_token_budget" INTEGER,
    "audit_prompts" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "workflow_conditions" ADD CONSTRAINT "workflow_conditions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_conditions" ADD CONSTRAINT "workflow_conditions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_conditions" ADD CONSTRAINT "workflow_conditions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "workflow_schedules" ADD CONSTRAINT "workflow_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_schedules" ADD CONSTRAINT "workflow_schedules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_schedules" ADD CONSTRAINT "workflow_schedules_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_triggered_by_user_id_fkey" FOREIGN KEY ("triggered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "workflow_execution_logs" ADD CONSTRAINT "workflow_execution_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_execution_logs" ADD CONSTRAINT "workflow_execution_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "workflow_execution_logs" ADD CONSTRAINT "workflow_execution_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_prompt_templates" ADD CONSTRAINT "ai_prompt_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "uq_feature_flags_scope_key" ON "feature_flags"("tenant_id", "workspace_id", "key");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_prompt_templates_scope_key_version" ON "ai_prompt_templates"("tenant_id", "workspace_id", "key", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ai_settings_scope" ON "ai_settings"("tenant_id", "workspace_id");

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_workflow_conditions_scope_workflow_sort" ON "workflow_conditions"("tenant_id", "workspace_id", "workflow_id", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_workflow_schedules_scope_workflow" ON "workflow_schedules"("tenant_id", "workspace_id", "workflow_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_workflow_schedules_scope_active_next" ON "workflow_schedules"("tenant_id", "workspace_id", "is_active", "next_run_at", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_scope_workflow_created" ON "workflow_executions"("tenant_id", "workspace_id", "workflow_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_workflow_executions_scope_status_retry" ON "workflow_executions"("tenant_id", "workspace_id", "status", "next_retry_at");
CREATE INDEX IF NOT EXISTS "idx_workflow_execution_logs_scope_execution" ON "workflow_execution_logs"("tenant_id", "workspace_id", "execution_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_feature_flags_scope_enabled" ON "feature_flags"("tenant_id", "workspace_id", "enabled", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_ai_provider_configs_scope_kind" ON "ai_provider_configs"("tenant_id", "workspace_id", "kind", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_ai_provider_configs_scope_default" ON "ai_provider_configs"("tenant_id", "workspace_id", "is_default", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_ai_prompt_templates_scope_key_active" ON "ai_prompt_templates"("tenant_id", "workspace_id", "key", "is_active", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_scope_owner" ON "ai_conversations"("tenant_id", "workspace_id", "owner_user_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_scope_status" ON "ai_conversations"("tenant_id", "workspace_id", "status", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_ai_messages_scope_conversation_created" ON "ai_messages"("tenant_id", "workspace_id", "conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_ai_usage_events_scope_occurred" ON "ai_usage_events"("tenant_id", "workspace_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_ai_usage_events_scope_provider" ON "ai_usage_events"("tenant_id", "workspace_id", "provider_kind", "occurred_at");
CREATE INDEX IF NOT EXISTS "idx_ai_usage_events_scope_feature" ON "ai_usage_events"("tenant_id", "workspace_id", "feature_key", "occurred_at");
