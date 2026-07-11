-- Lead enums
CREATE TYPE "lead_status" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
  'CONVERTED',
  'ARCHIVED'
);

CREATE TYPE "lead_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TYPE "lead_source" AS ENUM (
  'WEBSITE',
  'REFERRAL',
  'COLD_OUTREACH',
  'SOCIAL',
  'EVENT',
  'PARTNER',
  'OTHER'
);

CREATE TYPE "deal_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Expand DealStage (recreate enum)
CREATE TYPE "deal_stage_new" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'ARCHIVED'
);

ALTER TABLE "deals"
  ALTER COLUMN "stage" DROP DEFAULT,
  ALTER COLUMN "stage" TYPE "deal_stage_new"
  USING ("stage"::text::"deal_stage_new"),
  ALTER COLUMN "stage" SET DEFAULT 'NEW'::"deal_stage_new";

DROP TYPE "deal_stage";
ALTER TYPE "deal_stage_new" RENAME TO "deal_stage";

-- Expand DealFollowUpType with REMINDER
CREATE TYPE "deal_follow_up_type_new" AS ENUM (
  'CALL',
  'MEETING',
  'EMAIL',
  'WHATSAPP',
  'REMINDER'
);

ALTER TABLE "deal_followups"
  ALTER COLUMN "type" TYPE "deal_follow_up_type_new"
  USING ("type"::text::"deal_follow_up_type_new");

DROP TYPE "deal_follow_up_type";
ALTER TYPE "deal_follow_up_type_new" RENAME TO "deal_follow_up_type";

-- Expand ProposalStatus with VIEWED, EXPIRED
CREATE TYPE "proposal_status_new" AS ENUM (
  'DRAFT',
  'REVIEW',
  'SENT',
  'VIEWED',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED'
);

ALTER TABLE "proposals"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "proposal_status_new"
  USING ("status"::text::"proposal_status_new"),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"proposal_status_new";

ALTER TABLE "proposal_versions"
  ALTER COLUMN "status" TYPE "proposal_status_new"
  USING ("status"::text::"proposal_status_new");

DROP TYPE "proposal_status";
ALTER TYPE "proposal_status_new" RENAME TO "proposal_status";

-- Leads
CREATE TABLE "leads" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "code" TEXT,
  "company" TEXT NOT NULL,
  "contact_person" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "website" TEXT,
  "industry" TEXT,
  "country" TEXT,
  "source" "lead_source" NOT NULL DEFAULT 'OTHER',
  "assigned_to_user_id" UUID,
  "status" "lead_status" NOT NULL DEFAULT 'NEW',
  "lead_score" INTEGER,
  "priority" "lead_priority" NOT NULL DEFAULT 'MEDIUM',
  "expected_deal_size" DECIMAL(14,2),
  "notes" TEXT,
  "need" TEXT,
  "authority" TEXT,
  "budget_notes" TEXT,
  "timeline" TEXT,
  "pain_points" TEXT,
  "decision_maker" TEXT,
  "competitor" TEXT,
  "qualification_notes" TEXT,
  "converted_client_id" UUID,
  "converted_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_leads_tenant_id_workspace_id_code"
  ON "leads"("tenant_id", "workspace_id", "code");

CREATE INDEX "idx_leads_tenant_id" ON "leads"("tenant_id");
CREATE INDEX "idx_leads_tenant_id_workspace_id" ON "leads"("tenant_id", "workspace_id");
CREATE INDEX "idx_leads_tenant_id_workspace_id_status" ON "leads"("tenant_id", "workspace_id", "status");
CREATE INDEX "idx_leads_tenant_id_workspace_id_assigned_to" ON "leads"("tenant_id", "workspace_id", "assigned_to_user_id");
CREATE INDEX "idx_leads_tenant_id_workspace_id_source" ON "leads"("tenant_id", "workspace_id", "source");
CREATE INDEX "idx_leads_tenant_id_workspace_id_deleted_at" ON "leads"("tenant_id", "workspace_id", "deleted_at");
CREATE INDEX "idx_leads_tenant_id_workspace_id_updated_at" ON "leads"("tenant_id", "workspace_id", "updated_at");

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_assigned_to_user_id_fkey"
  FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_converted_client_id_fkey"
  FOREIGN KEY ("converted_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lead tags
CREATE TABLE "lead_tags" (
  "tenant_id" UUID NOT NULL,
  "lead_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("tenant_id", "lead_id", "tag_id")
);

CREATE INDEX "idx_lead_tags_tenant_id_tag_id" ON "lead_tags"("tenant_id", "tag_id");

ALTER TABLE "lead_tags"
  ADD CONSTRAINT "lead_tags_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_tags"
  ADD CONSTRAINT "lead_tags_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_tags"
  ADD CONSTRAINT "lead_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deal additive fields
ALTER TABLE "deals"
  ADD COLUMN "lead_id" UUID,
  ADD COLUMN "service" TEXT,
  ADD COLUMN "probability" INTEGER DEFAULT 0,
  ADD COLUMN "priority" "deal_priority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "stage_entered_at" TIMESTAMPTZ,
  ADD COLUMN "converted_project_id" UUID,
  ADD COLUMN "won_at" TIMESTAMPTZ,
  ADD COLUMN "lost_at" TIMESTAMPTZ;

CREATE INDEX "idx_deals_scope_lead_deleted"
  ON "deals"("tenant_id", "workspace_id", "lead_id", "deleted_at");
CREATE INDEX "idx_deals_scope_priority_deleted"
  ON "deals"("tenant_id", "workspace_id", "priority", "deleted_at");

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deals"
  ADD CONSTRAINT "deals_converted_project_id_fkey"
  FOREIGN KEY ("converted_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Deal stage history
CREATE TABLE "deal_stage_histories" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "deal_id" UUID NOT NULL,
  "from_stage" "deal_stage" NOT NULL,
  "to_stage" "deal_stage" NOT NULL,
  "entered_at" TIMESTAMPTZ NOT NULL,
  "exited_at" TIMESTAMPTZ,
  "duration_seconds" INTEGER,
  "changed_by_user_id" UUID,
  CONSTRAINT "deal_stage_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_deal_stage_histories_scope_deal"
  ON "deal_stage_histories"("tenant_id", "workspace_id", "deal_id");
CREATE INDEX "idx_deal_stage_histories_scope_to_stage"
  ON "deal_stage_histories"("tenant_id", "workspace_id", "to_stage");

ALTER TABLE "deal_stage_histories"
  ADD CONSTRAINT "deal_stage_histories_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_stage_histories"
  ADD CONSTRAINT "deal_stage_histories_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_stage_histories"
  ADD CONSTRAINT "deal_stage_histories_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_stage_histories"
  ADD CONSTRAINT "deal_stage_histories_changed_by_user_id_fkey"
  FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Follow-up additive fields
ALTER TABLE "deal_followups"
  ADD COLUMN "outcome" TEXT,
  ADD COLUMN "next_follow_up_at" TIMESTAMPTZ;

-- Proposal additive fields
ALTER TABLE "proposals"
  ADD COLUMN "amount" DECIMAL(14,2),
  ADD COLUMN "tax" DECIMAL(14,2),
  ADD COLUMN "discount" DECIMAL(14,2),
  ADD COLUMN "valid_until" DATE;

-- Quote revisions
CREATE TABLE "quote_revisions" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "quote_id" UUID NOT NULL,
  "revision" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "status" "quote_status" NOT NULL,
  "total_amount" DECIMAL(14,2) NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "valid_until" DATE,
  "line_items_json" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  CONSTRAINT "quote_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_quote_revisions_quote_revision"
  ON "quote_revisions"("quote_id", "revision");
CREATE INDEX "idx_quote_revisions_scope_quote"
  ON "quote_revisions"("tenant_id", "workspace_id", "quote_id");

ALTER TABLE "quote_revisions"
  ADD CONSTRAINT "quote_revisions_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quote_revisions"
  ADD CONSTRAINT "quote_revisions_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quote_revisions"
  ADD CONSTRAINT "quote_revisions_quote_id_fkey"
  FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quote_revisions"
  ADD CONSTRAINT "quote_revisions_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Project optional dealId
ALTER TABLE "projects" ADD COLUMN "deal_id" UUID;
CREATE INDEX "idx_projects_tenant_id_workspace_id_deal_id"
  ON "projects"("tenant_id", "workspace_id", "deal_id");
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invoice optional dealId
ALTER TABLE "invoices" ADD COLUMN "deal_id" UUID;
CREATE INDEX "idx_invoices_scope_deal_deleted"
  ON "invoices"("tenant_id", "workspace_id", "deal_id", "deleted_at");
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
