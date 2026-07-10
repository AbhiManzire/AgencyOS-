-- Align legacy contacts table with client_contacts schema used by the application.

DO $$
BEGIN
  CREATE TYPE "client_contact_status" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF to_regclass('public.contacts') IS NOT NULL AND to_regclass('public.client_contacts') IS NULL THEN
    ALTER TABLE "contacts" RENAME TO "client_contacts";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "client_contacts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "job_title" TEXT,
    "department" TEXT,
    "email" TEXT,
    "mobile" TEXT,
    "phone" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_decision_maker" BOOLEAN NOT NULL DEFAULT false,
    "status" "client_contact_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" UUID,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "client_contacts" ADD COLUMN IF NOT EXISTS "workspace_id" UUID;
ALTER TABLE "client_contacts" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "client_contacts" ADD COLUMN IF NOT EXISTS "mobile" TEXT;
ALTER TABLE "client_contacts" ADD COLUMN IF NOT EXISTS "is_decision_maker" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "client_contacts" ADD COLUMN IF NOT EXISTS "status" "client_contact_status" NOT NULL DEFAULT 'ACTIVE';

UPDATE "client_contacts" AS cc
SET "workspace_id" = c."workspace_id"
FROM "clients" AS c
WHERE cc."client_id" = c."id" AND cc."workspace_id" IS NULL;

ALTER TABLE "client_contacts" ALTER COLUMN "workspace_id" SET NOT NULL;

ALTER TABLE "client_contacts" DROP COLUMN IF EXISTS "is_billing_contact";
ALTER TABLE "client_contacts" DROP COLUMN IF EXISTS "notes";

CREATE INDEX IF NOT EXISTS "idx_client_contacts_tenant_id" ON "client_contacts"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_client_contacts_tenant_id_workspace_id_client_id" ON "client_contacts"("tenant_id", "workspace_id", "client_id");
CREATE INDEX IF NOT EXISTS "idx_client_contacts_tenant_id_deleted_at" ON "client_contacts"("tenant_id", "deleted_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_contacts_tenant_id_fkey'
  ) THEN
    ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_contacts_workspace_id_fkey'
  ) THEN
    ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_contacts_client_id_fkey'
  ) THEN
    ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
