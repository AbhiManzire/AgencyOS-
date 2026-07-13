-- Deal Management: pipelines, stages, deal fields, products, tags

CREATE TYPE "deal_forecast_category" AS ENUM ('PIPELINE', 'BEST_CASE', 'COMMIT', 'CLOSED', 'OMITTED');
CREATE TYPE "deal_status" AS ENUM ('OPEN', 'WON', 'LOST', 'ARCHIVED');

-- Recreate deal_stage enum with CRM default stages
CREATE TYPE "deal_stage_new" AS ENUM (
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'VERBAL_COMMIT',
  'WON',
  'LOST',
  'ARCHIVED'
);

ALTER TABLE "deals" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "deal_stage_histories" ALTER COLUMN "from_stage" DROP DEFAULT;
ALTER TABLE "deal_stage_histories" ALTER COLUMN "to_stage" DROP DEFAULT;

ALTER TABLE "deals"
  ALTER COLUMN "stage" TYPE "deal_stage_new"
  USING (
    CASE "stage"::text
      WHEN 'NEW' THEN 'QUALIFICATION'
      WHEN 'CONTACTED' THEN 'QUALIFICATION'
      WHEN 'QUALIFIED' THEN 'QUALIFICATION'
      WHEN 'DISCOVERY' THEN 'DISCOVERY'
      WHEN 'PROPOSAL' THEN 'PROPOSAL'
      WHEN 'NEGOTIATION' THEN 'NEGOTIATION'
      WHEN 'WON' THEN 'WON'
      WHEN 'LOST' THEN 'LOST'
      WHEN 'ARCHIVED' THEN 'ARCHIVED'
      ELSE 'QUALIFICATION'
    END::"deal_stage_new"
  );

ALTER TABLE "deal_stage_histories"
  ALTER COLUMN "from_stage" TYPE "deal_stage_new"
  USING (
    CASE "from_stage"::text
      WHEN 'NEW' THEN 'QUALIFICATION'
      WHEN 'CONTACTED' THEN 'QUALIFICATION'
      WHEN 'QUALIFIED' THEN 'QUALIFICATION'
      WHEN 'DISCOVERY' THEN 'DISCOVERY'
      WHEN 'PROPOSAL' THEN 'PROPOSAL'
      WHEN 'NEGOTIATION' THEN 'NEGOTIATION'
      WHEN 'WON' THEN 'WON'
      WHEN 'LOST' THEN 'LOST'
      WHEN 'ARCHIVED' THEN 'ARCHIVED'
      ELSE 'QUALIFICATION'
    END::"deal_stage_new"
  );

ALTER TABLE "deal_stage_histories"
  ALTER COLUMN "to_stage" TYPE "deal_stage_new"
  USING (
    CASE "to_stage"::text
      WHEN 'NEW' THEN 'QUALIFICATION'
      WHEN 'CONTACTED' THEN 'QUALIFICATION'
      WHEN 'QUALIFIED' THEN 'QUALIFICATION'
      WHEN 'DISCOVERY' THEN 'DISCOVERY'
      WHEN 'PROPOSAL' THEN 'PROPOSAL'
      WHEN 'NEGOTIATION' THEN 'NEGOTIATION'
      WHEN 'WON' THEN 'WON'
      WHEN 'LOST' THEN 'LOST'
      WHEN 'ARCHIVED' THEN 'ARCHIVED'
      ELSE 'QUALIFICATION'
    END::"deal_stage_new"
  );

DROP TYPE "deal_stage";
ALTER TYPE "deal_stage_new" RENAME TO "deal_stage";

ALTER TABLE "deals" ALTER COLUMN "stage" SET DEFAULT 'QUALIFICATION'::"deal_stage";

CREATE TABLE "sales_pipelines" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "sales_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_sales_pipelines_scope_name"
  ON "sales_pipelines"("tenant_id", "workspace_id", "name");
CREATE INDEX "idx_sales_pipelines_scope_default"
  ON "sales_pipelines"("tenant_id", "workspace_id", "is_default", "deleted_at");

ALTER TABLE "sales_pipelines"
  ADD CONSTRAINT "sales_pipelines_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_pipelines"
  ADD CONSTRAINT "sales_pipelines_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_pipelines"
  ADD CONSTRAINT "sales_pipelines_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_pipelines"
  ADD CONSTRAINT "sales_pipelines_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_pipelines"
  ADD CONSTRAINT "sales_pipelines_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "sales_pipeline_stages" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "pipeline_id" UUID NOT NULL,
  "stage_key" "deal_stage" NOT NULL,
  "name" TEXT NOT NULL,
  "probability" INTEGER NOT NULL DEFAULT 0,
  "color_token" TEXT,
  "sort_order" INTEGER NOT NULL,
  "is_won_stage" BOOLEAN NOT NULL DEFAULT false,
  "is_lost_stage" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "sales_pipeline_stages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_sales_pipeline_stages_pipeline_stage_key"
  ON "sales_pipeline_stages"("pipeline_id", "stage_key");
CREATE INDEX "idx_sales_pipeline_stages_scope_sort"
  ON "sales_pipeline_stages"("tenant_id", "workspace_id", "pipeline_id", "sort_order");

ALTER TABLE "sales_pipeline_stages"
  ADD CONSTRAINT "sales_pipeline_stages_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_pipeline_stages"
  ADD CONSTRAINT "sales_pipeline_stages_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_pipeline_stages"
  ADD CONSTRAINT "sales_pipeline_stages_pipeline_id_fkey"
  FOREIGN KEY ("pipeline_id") REFERENCES "sales_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_pipeline_stages"
  ADD CONSTRAINT "sales_pipeline_stages_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_pipeline_stages"
  ADD CONSTRAINT "sales_pipeline_stages_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_pipeline_stages"
  ADD CONSTRAINT "sales_pipeline_stages_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deals" ADD COLUMN "pipeline_id" UUID;
ALTER TABLE "deals" ADD COLUMN "pipeline_stage_id" UUID;
ALTER TABLE "deals" ADD COLUMN "description" TEXT;
ALTER TABLE "deals" ADD COLUMN "status" "deal_status" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "deals" ADD COLUMN "source" "lead_source";
ALTER TABLE "deals" ADD COLUMN "forecast_category" "deal_forecast_category" NOT NULL DEFAULT 'PIPELINE';
ALTER TABLE "deals" ADD COLUMN "loss_reason" TEXT;
ALTER TABLE "deals" ADD COLUMN "competitor" TEXT;
ALTER TABLE "deals" ADD COLUMN "loss_notes" TEXT;

UPDATE "deals"
SET "status" = CASE "stage"::text
  WHEN 'WON' THEN 'WON'::"deal_status"
  WHEN 'LOST' THEN 'LOST'::"deal_status"
  WHEN 'ARCHIVED' THEN 'ARCHIVED'::"deal_status"
  ELSE 'OPEN'::"deal_status"
END;

UPDATE "deals"
SET "probability" = CASE "stage"::text
  WHEN 'QUALIFICATION' THEN 10
  WHEN 'DISCOVERY' THEN 25
  WHEN 'PROPOSAL' THEN 50
  WHEN 'NEGOTIATION' THEN 75
  WHEN 'VERBAL_COMMIT' THEN 90
  WHEN 'WON' THEN 100
  WHEN 'LOST' THEN 0
  ELSE COALESCE("probability", 10)
END
WHERE "probability" IS NULL OR "probability" = 0;

ALTER TABLE "deals" ALTER COLUMN "probability" SET DEFAULT 10;

CREATE INDEX "idx_deals_scope_status_deleted"
  ON "deals"("tenant_id", "workspace_id", "status", "deleted_at");
CREATE INDEX "idx_deals_scope_pipeline_deleted"
  ON "deals"("tenant_id", "workspace_id", "pipeline_id", "deleted_at");
CREATE INDEX "idx_deals_scope_close_date"
  ON "deals"("tenant_id", "workspace_id", "expected_close_date", "deleted_at");

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_pipeline_id_fkey"
  FOREIGN KEY ("pipeline_id") REFERENCES "sales_pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deals"
  ADD CONSTRAINT "deals_pipeline_stage_id_fkey"
  FOREIGN KEY ("pipeline_stage_id") REFERENCES "sales_pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_line_items" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "deal_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" DECIMAL(12,4) NOT NULL,
  "unit_price" DECIMAL(14,2) NOT NULL,
  "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "subtotal" DECIMAL(14,2) NOT NULL,
  "total" DECIMAL(14,2) NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "deal_line_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_deal_line_items_scope_deal_sort"
  ON "deal_line_items"("tenant_id", "workspace_id", "deal_id", "deleted_at", "sort_order");

ALTER TABLE "deal_line_items"
  ADD CONSTRAINT "deal_line_items_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_line_items"
  ADD CONSTRAINT "deal_line_items_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_line_items"
  ADD CONSTRAINT "deal_line_items_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_line_items"
  ADD CONSTRAINT "deal_line_items_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_line_items"
  ADD CONSTRAINT "deal_line_items_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "deal_line_items"
  ADD CONSTRAINT "deal_line_items_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deal_tags" (
  "tenant_id" UUID NOT NULL,
  "deal_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "deal_tags_pkey" PRIMARY KEY ("tenant_id", "deal_id", "tag_id")
);

CREATE INDEX "idx_deal_tags_tenant_id_tag_id" ON "deal_tags"("tenant_id", "tag_id");

ALTER TABLE "deal_tags"
  ADD CONSTRAINT "deal_tags_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_tags"
  ADD CONSTRAINT "deal_tags_deal_id_fkey"
  FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deal_tags"
  ADD CONSTRAINT "deal_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
