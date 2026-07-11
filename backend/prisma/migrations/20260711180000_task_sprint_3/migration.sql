-- Expand TaskStatus (recreate enum; map legacy values).
CREATE TYPE "task_status_new" AS ENUM (
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED'
);

ALTER TABLE "tasks"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "task_status_new"
  USING (
    CASE "status"::text
      WHEN 'IN_REVIEW' THEN 'REVIEW'::"task_status_new"
      WHEN 'DONE' THEN 'COMPLETED'::"task_status_new"
      WHEN 'TODO' THEN 'TODO'::"task_status_new"
      WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'::"task_status_new"
      WHEN 'CANCELLED' THEN 'CANCELLED'::"task_status_new"
      ELSE 'TODO'::"task_status_new"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'TODO'::"task_status_new";

DROP TYPE "task_status";
ALTER TYPE "task_status_new" RENAME TO "task_status";

-- Expand TaskPriority (recreate enum; map legacy values).
CREATE TYPE "task_priority_new" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

ALTER TABLE "tasks"
  ALTER COLUMN "priority" DROP DEFAULT,
  ALTER COLUMN "priority" TYPE "task_priority_new"
  USING (
    CASE "priority"::text
      WHEN 'NORMAL' THEN 'MEDIUM'::"task_priority_new"
      WHEN 'URGENT' THEN 'CRITICAL'::"task_priority_new"
      WHEN 'LOW' THEN 'LOW'::"task_priority_new"
      WHEN 'HIGH' THEN 'HIGH'::"task_priority_new"
      ELSE 'MEDIUM'::"task_priority_new"
    END
  ),
  ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'::"task_priority_new";

DROP TYPE "task_priority";
ALTER TYPE "task_priority_new" RENAME TO "task_priority";

-- TaskType enum + task profile fields
CREATE TYPE "task_type" AS ENUM (
  'FEATURE',
  'BUG',
  'IMPROVEMENT',
  'RESEARCH',
  'MEETING',
  'SUPPORT',
  'OTHER'
);

ALTER TABLE "tasks"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "type" "task_type" NOT NULL DEFAULT 'FEATURE',
  ADD COLUMN "reporter_user_id" UUID,
  ADD COLUMN "actual_hours" DECIMAL(10,2),
  ADD COLUMN "completed_at" TIMESTAMPTZ,
  ADD COLUMN "board_order" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "uq_tasks_tenant_id_workspace_id_code"
  ON "tasks"("tenant_id", "workspace_id", "code");

CREATE INDEX "idx_tasks_scope_reporter_deleted"
  ON "tasks"("tenant_id", "workspace_id", "reporter_user_id", "deleted_at");
CREATE INDEX "idx_tasks_scope_due_date"
  ON "tasks"("tenant_id", "workspace_id", "due_date");
CREATE INDEX "idx_tasks_scope_priority"
  ON "tasks"("tenant_id", "workspace_id", "priority");
CREATE INDEX "idx_tasks_scope_board_order"
  ON "tasks"("tenant_id", "workspace_id", "board_order");
CREATE INDEX "idx_tasks_scope_type"
  ON "tasks"("tenant_id", "workspace_id", "type");

ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_reporter_user_id_fkey"
  FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Task tags
CREATE TABLE "task_tags" (
  "tenant_id" UUID NOT NULL,
  "task_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "task_tags_pkey" PRIMARY KEY ("tenant_id", "task_id", "tag_id")
);

CREATE INDEX "idx_task_tags_tenant_id_tag_id" ON "task_tags"("tenant_id", "tag_id");

ALTER TABLE "task_tags"
  ADD CONSTRAINT "task_tags_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_tags"
  ADD CONSTRAINT "task_tags_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_tags"
  ADD CONSTRAINT "task_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Task dependencies
CREATE TABLE "task_dependencies" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "task_id" UUID NOT NULL,
  "depends_on_task_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_dependencies_no_self_dep" CHECK ("task_id" <> "depends_on_task_id")
);

CREATE UNIQUE INDEX "uq_task_dependencies_task_id_depends_on_task_id"
  ON "task_dependencies"("task_id", "depends_on_task_id");
CREATE INDEX "idx_task_dependencies_tenant_id"
  ON "task_dependencies"("tenant_id");
CREATE INDEX "idx_task_dependencies_scope_task"
  ON "task_dependencies"("tenant_id", "workspace_id", "task_id");
CREATE INDEX "idx_task_dependencies_scope_depends_on"
  ON "task_dependencies"("tenant_id", "workspace_id", "depends_on_task_id");

ALTER TABLE "task_dependencies"
  ADD CONSTRAINT "task_dependencies_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_dependencies"
  ADD CONSTRAINT "task_dependencies_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_dependencies"
  ADD CONSTRAINT "task_dependencies_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_dependencies"
  ADD CONSTRAINT "task_dependencies_depends_on_task_id_fkey"
  FOREIGN KEY ("depends_on_task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
