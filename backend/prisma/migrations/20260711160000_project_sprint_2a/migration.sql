-- Expand ProjectStatus with ARCHIVED (recreate enum for transactional safety).
CREATE TYPE "project_status_new" AS ENUM (
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'INVOICE_READY',
  'CANCELLED',
  'ARCHIVED'
);

ALTER TABLE "projects"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "project_status_new"
  USING ("status"::text::"project_status_new"),
  ALTER COLUMN "status" SET DEFAULT 'PLANNING'::"project_status_new";

DROP TYPE "project_status";
ALTER TYPE "project_status_new" RENAME TO "project_status";

-- Project profile fields
ALTER TABLE "projects" ADD COLUMN "department_id" UUID,
ADD COLUMN "budget_amount" DECIMAL(14,2),
ADD COLUMN "estimated_hours" DECIMAL(10,2),
ADD COLUMN "actual_hours" DECIMAL(10,2);

CREATE INDEX "idx_projects_tenant_id_workspace_id_department_id"
  ON "projects"("tenant_id", "workspace_id", "department_id");
CREATE INDEX "idx_projects_tenant_id_workspace_id_target_end_date"
  ON "projects"("tenant_id", "workspace_id", "target_end_date");

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Expand ProjectMemberRole
CREATE TYPE "project_member_role_new" AS ENUM (
  'MANAGER',
  'DEVELOPER',
  'DESIGNER',
  'QA',
  'VIEWER'
);

ALTER TABLE "project_members"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "project_member_role_new"
  USING (
    CASE "role"::text
      WHEN 'LEAD' THEN 'MANAGER'::"project_member_role_new"
      WHEN 'MEMBER' THEN 'DEVELOPER'::"project_member_role_new"
      WHEN 'VIEWER' THEN 'VIEWER'::"project_member_role_new"
      ELSE 'DEVELOPER'::"project_member_role_new"
    END
  ),
  ALTER COLUMN "role" SET DEFAULT 'DEVELOPER'::"project_member_role_new";

DROP TYPE "project_member_role";
ALTER TYPE "project_member_role_new" RENAME TO "project_member_role";

-- Project tags
CREATE TABLE "project_tags" (
  "tenant_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "tag_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "project_tags_pkey" PRIMARY KEY ("tenant_id", "project_id", "tag_id")
);

CREATE INDEX "idx_project_tags_tenant_id_tag_id" ON "project_tags"("tenant_id", "tag_id");

ALTER TABLE "project_tags"
  ADD CONSTRAINT "project_tags_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_tags"
  ADD CONSTRAINT "project_tags_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "project_tags"
  ADD CONSTRAINT "project_tags_tag_id_fkey"
  FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
