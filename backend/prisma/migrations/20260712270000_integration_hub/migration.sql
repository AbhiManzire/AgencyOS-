-- Integration Hub: connections, credentials, webhooks, sync jobs/logs

CREATE TYPE "integration_provider_key" AS ENUM (
  'META_LEAD_ADS',
  'GOOGLE_LEAD_FORMS',
  'GOOGLE_ADS',
  'GOOGLE_ANALYTICS',
  'WEBSITE_FORMS',
  'WHATSAPP_BUSINESS',
  'GMAIL',
  'OUTLOOK',
  'STRIPE',
  'RAZORPAY',
  'PHONEPE',
  'PAYPAL',
  'TALLY',
  'ZOHO_BOOKS',
  'SLACK',
  'MICROSOFT_TEAMS',
  'WEBHOOK',
  'REST_API',
  'CUSTOM'
);

CREATE TYPE "integration_category" AS ENUM (
  'LEADS',
  'ADS',
  'ANALYTICS',
  'MESSAGING',
  'EMAIL',
  'PAYMENTS',
  'ACCOUNTING',
  'COLLABORATION',
  'WEBHOOK',
  'CUSTOM'
);

CREATE TYPE "integration_connection_status" AS ENUM (
  'CONNECTED',
  'DISCONNECTED',
  'ERROR',
  'PENDING'
);

CREATE TYPE "integration_webhook_direction" AS ENUM (
  'INCOMING',
  'OUTGOING'
);

CREATE TYPE "integration_webhook_delivery_status" AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'RETRYING'
);

CREATE TYPE "integration_sync_trigger" AS ENUM (
  'MANUAL',
  'SCHEDULED',
  'WEBHOOK'
);

CREATE TYPE "integration_sync_direction" AS ENUM (
  'INBOUND',
  'OUTBOUND',
  'BIDIRECTIONAL'
);

CREATE TYPE "integration_sync_status" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "integration_connections" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "provider_key" "integration_provider_key" NOT NULL,
  "display_name" TEXT NOT NULL,
  "category" "integration_category" NOT NULL,
  "status" "integration_connection_status" NOT NULL DEFAULT 'DISCONNECTED',
  "config" JSONB NOT NULL DEFAULT '{}',
  "last_sync_at" TIMESTAMPTZ,
  "last_health_at" TIMESTAMPTZ,
  "last_error" TEXT,
  "health_payload" JSONB,
  "rate_limit_info" JSONB,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_integration_connections_scope_provider_name"
  ON "integration_connections"("tenant_id", "workspace_id", "provider_key", "display_name");
CREATE INDEX "idx_integration_connections_scope_status"
  ON "integration_connections"("tenant_id", "workspace_id", "status", "deleted_at");
CREATE INDEX "idx_integration_connections_scope_provider"
  ON "integration_connections"("tenant_id", "workspace_id", "provider_key", "deleted_at");

ALTER TABLE "integration_connections"
  ADD CONSTRAINT "integration_connections_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_connections"
  ADD CONSTRAINT "integration_connections_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_connections"
  ADD CONSTRAINT "integration_connections_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "integration_connections"
  ADD CONSTRAINT "integration_connections_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "integration_connections"
  ADD CONSTRAINT "integration_connections_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "integration_credentials" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "connection_id" UUID NOT NULL,
  "ciphertext" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "auth_tag" TEXT NOT NULL,
  "key_version" INTEGER NOT NULL DEFAULT 1,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  CONSTRAINT "integration_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_credentials_connection_id_key"
  ON "integration_credentials"("connection_id");
CREATE INDEX "idx_integration_credentials_scope"
  ON "integration_credentials"("tenant_id", "workspace_id");

ALTER TABLE "integration_credentials"
  ADD CONSTRAINT "integration_credentials_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_credentials"
  ADD CONSTRAINT "integration_credentials_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_credentials"
  ADD CONSTRAINT "integration_credentials_connection_id_fkey"
  FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_credentials"
  ADD CONSTRAINT "integration_credentials_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "integration_credentials"
  ADD CONSTRAINT "integration_credentials_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "integration_webhooks" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "connection_id" UUID NOT NULL,
  "direction" "integration_webhook_direction" NOT NULL,
  "name" TEXT NOT NULL,
  "endpoint_path" TEXT,
  "target_url" TEXT,
  "secret_hash" TEXT,
  "signature_header" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "integration_webhooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_integration_webhooks_scope_connection"
  ON "integration_webhooks"("tenant_id", "workspace_id", "connection_id", "deleted_at");
CREATE INDEX "idx_integration_webhooks_scope_path"
  ON "integration_webhooks"("tenant_id", "workspace_id", "endpoint_path", "deleted_at");

ALTER TABLE "integration_webhooks"
  ADD CONSTRAINT "integration_webhooks_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_webhooks"
  ADD CONSTRAINT "integration_webhooks_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_webhooks"
  ADD CONSTRAINT "integration_webhooks_connection_id_fkey"
  FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_webhooks"
  ADD CONSTRAINT "integration_webhooks_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "integration_webhooks"
  ADD CONSTRAINT "integration_webhooks_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "integration_webhook_deliveries" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "webhook_id" UUID NOT NULL,
  "direction" "integration_webhook_direction" NOT NULL,
  "status" "integration_webhook_delivery_status" NOT NULL DEFAULT 'PENDING',
  "http_status" INTEGER,
  "request_payload" JSONB,
  "response_payload" JSONB,
  "error_message" TEXT,
  "signature_valid" BOOLEAN,
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 3,
  "next_retry_at" TIMESTAMPTZ,
  "duration_ms" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "finished_at" TIMESTAMPTZ,
  CONSTRAINT "integration_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_integration_webhook_deliveries_scope_webhook"
  ON "integration_webhook_deliveries"("tenant_id", "workspace_id", "webhook_id", "created_at");
CREATE INDEX "idx_integration_webhook_deliveries_scope_retry"
  ON "integration_webhook_deliveries"("tenant_id", "workspace_id", "status", "next_retry_at");

ALTER TABLE "integration_webhook_deliveries"
  ADD CONSTRAINT "integration_webhook_deliveries_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_webhook_deliveries"
  ADD CONSTRAINT "integration_webhook_deliveries_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_webhook_deliveries"
  ADD CONSTRAINT "integration_webhook_deliveries_webhook_id_fkey"
  FOREIGN KEY ("webhook_id") REFERENCES "integration_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "integration_sync_jobs" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "connection_id" UUID NOT NULL,
  "trigger" "integration_sync_trigger" NOT NULL,
  "direction" "integration_sync_direction" NOT NULL DEFAULT 'INBOUND',
  "status" "integration_sync_status" NOT NULL DEFAULT 'PENDING',
  "scheduled_for" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ,
  "finished_at" TIMESTAMPTZ,
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 3,
  "next_retry_at" TIMESTAMPTZ,
  "error_message" TEXT,
  "config" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  CONSTRAINT "integration_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_integration_sync_jobs_scope_connection"
  ON "integration_sync_jobs"("tenant_id", "workspace_id", "connection_id", "created_at");
CREATE INDEX "idx_integration_sync_jobs_scope_scheduled"
  ON "integration_sync_jobs"("tenant_id", "workspace_id", "status", "scheduled_for");
CREATE INDEX "idx_integration_sync_jobs_scope_retry"
  ON "integration_sync_jobs"("tenant_id", "workspace_id", "status", "next_retry_at");

ALTER TABLE "integration_sync_jobs"
  ADD CONSTRAINT "integration_sync_jobs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_sync_jobs"
  ADD CONSTRAINT "integration_sync_jobs_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_sync_jobs"
  ADD CONSTRAINT "integration_sync_jobs_connection_id_fkey"
  FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_sync_jobs"
  ADD CONSTRAINT "integration_sync_jobs_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "integration_sync_logs" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "connection_id" UUID NOT NULL,
  "sync_job_id" UUID,
  "provider_key" "integration_provider_key" NOT NULL,
  "direction" "integration_sync_direction" NOT NULL,
  "status" "integration_sync_status" NOT NULL,
  "payload" JSONB,
  "result" JSONB,
  "error_message" TEXT,
  "duration_ms" INTEGER,
  "retries" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "integration_sync_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_integration_sync_logs_scope_connection"
  ON "integration_sync_logs"("tenant_id", "workspace_id", "connection_id", "created_at");
CREATE INDEX "idx_integration_sync_logs_scope_provider"
  ON "integration_sync_logs"("tenant_id", "workspace_id", "provider_key", "created_at");

ALTER TABLE "integration_sync_logs"
  ADD CONSTRAINT "integration_sync_logs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_sync_logs"
  ADD CONSTRAINT "integration_sync_logs_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_sync_logs"
  ADD CONSTRAINT "integration_sync_logs_connection_id_fkey"
  FOREIGN KEY ("connection_id") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "integration_sync_logs"
  ADD CONSTRAINT "integration_sync_logs_sync_job_id_fkey"
  FOREIGN KEY ("sync_job_id") REFERENCES "integration_sync_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
