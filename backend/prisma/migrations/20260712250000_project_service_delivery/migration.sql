-- Project & Service Delivery: templates, health, milestones deps, checklist, roles

CREATE TYPE "project_health_status" AS ENUM ('GREEN', 'YELLOW', 'RED');

CREATE TYPE "project_service_type" AS ENUM (
  'WEBSITE_DEVELOPMENT',
  'SEO',
  'GOOGLE_ADS',
  'META_ADS',
  'HOSTING',
  'SOFTWARE_DEVELOPMENT',
  'AI_AUTOMATION',
  'BRANDING',
  'CUSTOM'
);

CREATE TYPE "project_deliverable_status" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'DELIVERED',
  'APPROVED',
  'REJECTED'
);

ALTER TYPE "project_member_role" ADD VALUE IF NOT EXISTS 'SEO';
ALTER TYPE "project_member_role" ADD VALUE IF NOT EXISTS 'MARKETING';
ALTER TYPE "project_member_role" ADD VALUE IF NOT EXISTS 'ACCOUNTS';
ALTER TYPE "project_member_role" ADD VALUE IF NOT EXISTS 'CUSTOM';

ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'MILESTONE_COMPLETED';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'TASK_ASSIGNED';

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "template_id" UUID,
  ADD COLUMN IF NOT EXISTS "primary_contact_id" UUID,
  ADD COLUMN IF NOT EXISTS "service_type" "project_service_type",
  ADD COLUMN IF NOT EXISTS "service_label" TEXT,
  ADD COLUMN IF NOT EXISTS "health_status" "project_health_status",
  ADD COLUMN IF NOT EXISTS "health_score" INTEGER,
  ADD COLUMN IF NOT EXISTS "health_calculated_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "idx_projects_tenant_id_workspace_id_template_id"
  ON "projects"("tenant_id", "workspace_id", "template_id");
CREATE INDEX IF NOT EXISTS "idx_projects_tenant_id_workspace_id_health_status"
  ON "projects"("tenant_id", "workspace_id", "health_status");

ALTER TABLE "project_members"
  ADD COLUMN IF NOT EXISTS "custom_role_label" TEXT;

ALTER TABLE "project_milestones"
  ADD COLUMN IF NOT EXISTS "completion_percent" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "project_milestone_dependencies" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "milestone_id" UUID NOT NULL,
  "depends_on_milestone_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "project_milestone_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_proj_ms_deps_milestone_depends_on"
  ON "project_milestone_dependencies"("milestone_id", "depends_on_milestone_id");
CREATE INDEX "idx_proj_ms_deps_tenant_id" ON "project_milestone_dependencies"("tenant_id");
CREATE INDEX "idx_proj_ms_deps_scope_milestone"
  ON "project_milestone_dependencies"("tenant_id", "workspace_id", "milestone_id");
CREATE INDEX "idx_proj_ms_deps_scope_depends_on"
  ON "project_milestone_dependencies"("tenant_id", "workspace_id", "depends_on_milestone_id");

ALTER TABLE "project_milestone_dependencies"
  ADD CONSTRAINT "project_milestone_dependencies_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_milestone_dependencies"
  ADD CONSTRAINT "project_milestone_dependencies_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_milestone_dependencies"
  ADD CONSTRAINT "project_milestone_dependencies_milestone_id_fkey"
  FOREIGN KEY ("milestone_id") REFERENCES "project_milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_milestone_dependencies"
  ADD CONSTRAINT "project_milestone_dependencies_depends_on_milestone_id_fkey"
  FOREIGN KEY ("depends_on_milestone_id") REFERENCES "project_milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "task_checklist_items" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "task_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "task_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_task_checklist_items_tenant_id" ON "task_checklist_items"("tenant_id");
CREATE INDEX "idx_task_checklist_items_scope_task"
  ON "task_checklist_items"("tenant_id", "workspace_id", "task_id", "deleted_at", "sort_order");

ALTER TABLE "task_checklist_items"
  ADD CONSTRAINT "task_checklist_items_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_checklist_items"
  ADD CONSTRAINT "task_checklist_items_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_checklist_items"
  ADD CONSTRAINT "task_checklist_items_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_checklist_items"
  ADD CONSTRAINT "task_checklist_items_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_checklist_items"
  ADD CONSTRAINT "task_checklist_items_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "task_checklist_items"
  ADD CONSTRAINT "task_checklist_items_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "project_templates" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "service_type" "project_service_type" NOT NULL,
  "default_duration_days" INTEGER,
  "default_estimated_hours" DECIMAL(10, 2),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_project_templates_scope_name"
  ON "project_templates"("tenant_id", "workspace_id", "name");
CREATE INDEX "idx_project_templates_tenant_id" ON "project_templates"("tenant_id");
CREATE INDEX "idx_project_templates_scope_active"
  ON "project_templates"("tenant_id", "workspace_id", "is_active", "deleted_at");

ALTER TABLE "project_templates"
  ADD CONSTRAINT "project_templates_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_templates"
  ADD CONSTRAINT "project_templates_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_templates"
  ADD CONSTRAINT "project_templates_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_templates"
  ADD CONSTRAINT "project_templates_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_templates"
  ADD CONSTRAINT "project_templates_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "project_template_milestones" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "offset_days" INTEGER NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "project_template_milestones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_proj_tmpl_ms_scope_template_sort"
  ON "project_template_milestones"("tenant_id", "workspace_id", "template_id", "sort_order");

ALTER TABLE "project_template_milestones"
  ADD CONSTRAINT "project_template_milestones_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_milestones"
  ADD CONSTRAINT "project_template_milestones_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_milestones"
  ADD CONSTRAINT "project_template_milestones_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "project_template_tasks" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "template_milestone_id" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "task_priority" NOT NULL DEFAULT 'MEDIUM',
  "estimated_hours" DECIMAL(10, 2),
  "offset_days" INTEGER NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "checklist_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "project_template_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_proj_tmpl_tasks_scope_template_sort"
  ON "project_template_tasks"("tenant_id", "workspace_id", "template_id", "sort_order");

ALTER TABLE "project_template_tasks"
  ADD CONSTRAINT "project_template_tasks_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_tasks"
  ADD CONSTRAINT "project_template_tasks_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_tasks"
  ADD CONSTRAINT "project_template_tasks_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_template_tasks"
  ADD CONSTRAINT "project_template_tasks_template_milestone_id_fkey"
  FOREIGN KEY ("template_milestone_id") REFERENCES "project_template_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "project_template_deliverables" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "project_template_deliverables_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_proj_tmpl_deliverables_scope_sort"
  ON "project_template_deliverables"("tenant_id", "workspace_id", "template_id", "sort_order");

ALTER TABLE "project_template_deliverables"
  ADD CONSTRAINT "project_template_deliverables_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_deliverables"
  ADD CONSTRAINT "project_template_deliverables_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_deliverables"
  ADD CONSTRAINT "project_template_deliverables_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "project_template_required_documents" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "folder" "client_document_folder",
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "project_template_required_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_proj_tmpl_req_docs_scope_sort"
  ON "project_template_required_documents"("tenant_id", "workspace_id", "template_id", "sort_order");

ALTER TABLE "project_template_required_documents"
  ADD CONSTRAINT "project_template_required_documents_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_required_documents"
  ADD CONSTRAINT "project_template_required_documents_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_template_required_documents"
  ADD CONSTRAINT "project_template_required_documents_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "project_deliverables" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "project_deliverable_status" NOT NULL DEFAULT 'PENDING',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "project_deliverables_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_project_deliverables_scope_project"
  ON "project_deliverables"("tenant_id", "workspace_id", "project_id", "deleted_at");

ALTER TABLE "project_deliverables"
  ADD CONSTRAINT "project_deliverables_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_deliverables"
  ADD CONSTRAINT "project_deliverables_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_deliverables"
  ADD CONSTRAINT "project_deliverables_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_deliverables"
  ADD CONSTRAINT "project_deliverables_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_deliverables"
  ADD CONSTRAINT "project_deliverables_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_deliverables"
  ADD CONSTRAINT "project_deliverables_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_primary_contact_id_fkey"
  FOREIGN KEY ("primary_contact_id") REFERENCES "client_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
