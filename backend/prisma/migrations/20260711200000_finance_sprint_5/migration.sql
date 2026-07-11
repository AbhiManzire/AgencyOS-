-- Sprint 5 Finance OS

-- TaxMode, ApprovalStatus, and related enums
CREATE TYPE "tax_mode" AS ENUM ('TAX_EXCLUSIVE', 'TAX_INCLUSIVE');

CREATE TYPE "approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED');

CREATE TYPE "purchase_bill_status" AS ENUM (
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED'
);

CREATE TYPE "credit_note_status" AS ENUM ('DRAFT', 'ISSUED', 'APPLIED', 'VOID');

CREATE TYPE "recurring_frequency" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

CREATE TYPE "ledger_account_type" AS ENUM (
  'RECEIVABLE',
  'PAYABLE',
  'PAYMENT',
  'CLIENT',
  'VENDOR'
);

-- Expand InvoiceStatus
CREATE TYPE "invoice_status_new" AS ENUM (
  'DRAFT',
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
  'VOID'
);

ALTER TABLE "invoices"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "invoice_status_new"
  USING ("status"::text::"invoice_status_new"),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"invoice_status_new";

DROP TYPE "invoice_status";
ALTER TYPE "invoice_status_new" RENAME TO "invoice_status";

-- Expand PaymentMethod (keep CHECK for compatibility; add UPI, ONLINE, CHEQUE)
CREATE TYPE "payment_method_new" AS ENUM (
  'CASH',
  'BANK_TRANSFER',
  'UPI',
  'CARD',
  'CHEQUE',
  'CHECK',
  'ONLINE',
  'OTHER'
);

ALTER TABLE "payments"
  ALTER COLUMN "method" TYPE "payment_method_new"
  USING ("method"::text::"payment_method_new");

DROP TYPE "payment_method";
ALTER TYPE "payment_method_new" RENAME TO "payment_method";

-- Client billing fields
ALTER TABLE "clients"
  ADD COLUMN "payment_terms_days" INTEGER DEFAULT 30,
  ADD COLUMN "credit_limit" DECIMAL(14, 2);

-- Invoice finance fields
ALTER TABLE "invoices"
  ADD COLUMN "terms" TEXT,
  ADD COLUMN "discount_amount" DECIMAL(14, 2) DEFAULT 0,
  ADD COLUMN "tax_amount" DECIMAL(14, 2) DEFAULT 0,
  ADD COLUMN "subtotal" DECIMAL(14, 2) DEFAULT 0,
  ADD COLUMN "grand_total" DECIMAL(14, 2) DEFAULT 0,
  ADD COLUMN "balance_due" DECIMAL(14, 2) DEFAULT 0,
  ADD COLUMN "tax_mode" "tax_mode" NOT NULL DEFAULT 'TAX_EXCLUSIVE',
  ADD COLUMN "viewed_at" TIMESTAMPTZ,
  ADD COLUMN "approval_status" "approval_status" NOT NULL DEFAULT 'NOT_REQUIRED';

-- Payment approval
ALTER TABLE "payments"
  ADD COLUMN "approval_status" "approval_status" NOT NULL DEFAULT 'NOT_REQUIRED';

-- Vendors
CREATE TABLE "vendors" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "gstin" TEXT,
  "pan" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "contact_person" TEXT,
  "payment_terms_days" INTEGER,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_vendors_scope_code"
  ON "vendors" ("tenant_id", "workspace_id", "code");
CREATE INDEX "idx_vendors_scope_deleted"
  ON "vendors" ("tenant_id", "workspace_id", "deleted_at");
CREATE INDEX "idx_vendors_scope_name"
  ON "vendors" ("tenant_id", "workspace_id", "name");

ALTER TABLE "vendors"
  ADD CONSTRAINT "vendors_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendors"
  ADD CONSTRAINT "vendors_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vendors"
  ADD CONSTRAINT "vendors_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendors"
  ADD CONSTRAINT "vendors_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendors"
  ADD CONSTRAINT "vendors_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Expenses
CREATE TABLE "expenses" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "vendor_id" UUID,
  "category" TEXT NOT NULL,
  "department_id" UUID,
  "employee_user_id" UUID,
  "amount" DECIMAL(14, 2) NOT NULL,
  "tax_amount" DECIMAL(14, 2),
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "expense_date" DATE NOT NULL,
  "description" TEXT,
  "approval_status" "approval_status" NOT NULL DEFAULT 'PENDING',
  "attachment_file_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_expenses_scope_deleted"
  ON "expenses" ("tenant_id", "workspace_id", "deleted_at");
CREATE INDEX "idx_expenses_scope_vendor_deleted"
  ON "expenses" ("tenant_id", "workspace_id", "vendor_id", "deleted_at");
CREATE INDEX "idx_expenses_scope_approval_deleted"
  ON "expenses" ("tenant_id", "workspace_id", "approval_status", "deleted_at");
CREATE INDEX "idx_expenses_scope_expense_date"
  ON "expenses" ("tenant_id", "workspace_id", "expense_date");

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_employee_user_id_fkey"
  FOREIGN KEY ("employee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_attachment_file_id_fkey"
  FOREIGN KEY ("attachment_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Purchase bills
CREATE TABLE "purchase_bills" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "bill_number" TEXT NOT NULL,
  "status" "purchase_bill_status" NOT NULL DEFAULT 'DRAFT',
  "issue_date" DATE NOT NULL,
  "due_date" DATE NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "subtotal" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "tax_amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "grand_total" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "balance_due" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "purchase_bills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_purchase_bills_scope_bill_number"
  ON "purchase_bills" ("tenant_id", "workspace_id", "bill_number");
CREATE INDEX "idx_purchase_bills_scope_vendor_deleted"
  ON "purchase_bills" ("tenant_id", "workspace_id", "vendor_id", "deleted_at");
CREATE INDEX "idx_purchase_bills_scope_status_deleted"
  ON "purchase_bills" ("tenant_id", "workspace_id", "status", "deleted_at");

ALTER TABLE "purchase_bills"
  ADD CONSTRAINT "purchase_bills_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_bills"
  ADD CONSTRAINT "purchase_bills_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_bills"
  ADD CONSTRAINT "purchase_bills_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_bills"
  ADD CONSTRAINT "purchase_bills_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_bills"
  ADD CONSTRAINT "purchase_bills_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_bills"
  ADD CONSTRAINT "purchase_bills_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Purchase bill line items
CREATE TABLE "purchase_bill_line_items" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "purchase_bill_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" DECIMAL(12, 4) NOT NULL,
  "unit" TEXT,
  "unit_price" DECIMAL(14, 2) NOT NULL,
  "discount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "total" DECIMAL(14, 2) NOT NULL,
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "purchase_bill_line_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_purchase_bill_line_items_scope_bill_sort"
  ON "purchase_bill_line_items" ("tenant_id", "workspace_id", "purchase_bill_id", "deleted_at", "sort_order");

ALTER TABLE "purchase_bill_line_items"
  ADD CONSTRAINT "purchase_bill_line_items_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_bill_line_items"
  ADD CONSTRAINT "purchase_bill_line_items_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_bill_line_items"
  ADD CONSTRAINT "purchase_bill_line_items_purchase_bill_id_fkey"
  FOREIGN KEY ("purchase_bill_id") REFERENCES "purchase_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_bill_line_items"
  ADD CONSTRAINT "purchase_bill_line_items_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_bill_line_items"
  ADD CONSTRAINT "purchase_bill_line_items_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_bill_line_items"
  ADD CONSTRAINT "purchase_bill_line_items_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Purchase payments
CREATE TABLE "purchase_payments" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "purchase_bill_id" UUID NOT NULL,
  "amount" DECIMAL(14, 2) NOT NULL,
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "status" "payment_status" NOT NULL DEFAULT 'COMPLETED',
  "method" "payment_method" NOT NULL,
  "paid_at" TIMESTAMPTZ NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "approval_status" "approval_status" NOT NULL DEFAULT 'NOT_REQUIRED',
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "purchase_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_purchase_payments_scope_bill_deleted"
  ON "purchase_payments" ("tenant_id", "workspace_id", "purchase_bill_id", "deleted_at");
CREATE INDEX "idx_purchase_payments_scope_paid_at"
  ON "purchase_payments" ("tenant_id", "workspace_id", "paid_at");

ALTER TABLE "purchase_payments"
  ADD CONSTRAINT "purchase_payments_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_payments"
  ADD CONSTRAINT "purchase_payments_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_payments"
  ADD CONSTRAINT "purchase_payments_purchase_bill_id_fkey"
  FOREIGN KEY ("purchase_bill_id") REFERENCES "purchase_bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_payments"
  ADD CONSTRAINT "purchase_payments_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_payments"
  ADD CONSTRAINT "purchase_payments_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_payments"
  ADD CONSTRAINT "purchase_payments_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Credit notes
CREATE TABLE "credit_notes" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "invoice_id" UUID,
  "credit_note_number" TEXT NOT NULL,
  "issue_date" DATE NOT NULL,
  "amount" DECIMAL(14, 2) NOT NULL,
  "tax_amount" DECIMAL(14, 2),
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "status" "credit_note_status" NOT NULL DEFAULT 'DRAFT',
  "applied_amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_credit_notes_scope_number"
  ON "credit_notes" ("tenant_id", "workspace_id", "credit_note_number");
CREATE INDEX "idx_credit_notes_scope_client_deleted"
  ON "credit_notes" ("tenant_id", "workspace_id", "client_id", "deleted_at");
CREATE INDEX "idx_credit_notes_scope_status_deleted"
  ON "credit_notes" ("tenant_id", "workspace_id", "status", "deleted_at");

ALTER TABLE "credit_notes"
  ADD CONSTRAINT "credit_notes_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_notes"
  ADD CONSTRAINT "credit_notes_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_notes"
  ADD CONSTRAINT "credit_notes_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_notes"
  ADD CONSTRAINT "credit_notes_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "credit_notes"
  ADD CONSTRAINT "credit_notes_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "credit_notes"
  ADD CONSTRAINT "credit_notes_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "credit_notes"
  ADD CONSTRAINT "credit_notes_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Credit note applications
CREATE TABLE "credit_note_applications" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "credit_note_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "amount" DECIMAL(14, 2) NOT NULL,
  "applied_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  CONSTRAINT "credit_note_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_credit_note_applications_scope_credit_note"
  ON "credit_note_applications" ("tenant_id", "workspace_id", "credit_note_id");
CREATE INDEX "idx_credit_note_applications_scope_invoice"
  ON "credit_note_applications" ("tenant_id", "workspace_id", "invoice_id");

ALTER TABLE "credit_note_applications"
  ADD CONSTRAINT "credit_note_applications_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_note_applications"
  ADD CONSTRAINT "credit_note_applications_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_note_applications"
  ADD CONSTRAINT "credit_note_applications_credit_note_id_fkey"
  FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_note_applications"
  ADD CONSTRAINT "credit_note_applications_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_note_applications"
  ADD CONSTRAINT "credit_note_applications_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recurring invoices
CREATE TABLE "recurring_invoices" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "frequency" "recurring_frequency" NOT NULL,
  "next_run_at" TIMESTAMPTZ NOT NULL,
  "last_run_at" TIMESTAMPTZ,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "template" JSONB NOT NULL,
  "reminder_days_before" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "recurring_invoices_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_recurring_invoices_scope_active_next"
  ON "recurring_invoices" ("tenant_id", "workspace_id", "is_active", "next_run_at", "deleted_at");

ALTER TABLE "recurring_invoices"
  ADD CONSTRAINT "recurring_invoices_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_invoices"
  ADD CONSTRAINT "recurring_invoices_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_invoices"
  ADD CONSTRAINT "recurring_invoices_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recurring_invoices"
  ADD CONSTRAINT "recurring_invoices_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recurring_invoices"
  ADD CONSTRAINT "recurring_invoices_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recurring expenses
CREATE TABLE "recurring_expenses" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "frequency" "recurring_frequency" NOT NULL,
  "next_run_at" TIMESTAMPTZ NOT NULL,
  "last_run_at" TIMESTAMPTZ,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "template" JSONB NOT NULL,
  "reminder_days_before" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  "updated_by_user_id" UUID,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by_user_id" UUID,
  CONSTRAINT "recurring_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_recurring_expenses_scope_active_next"
  ON "recurring_expenses" ("tenant_id", "workspace_id", "is_active", "next_run_at", "deleted_at");

ALTER TABLE "recurring_expenses"
  ADD CONSTRAINT "recurring_expenses_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_expenses"
  ADD CONSTRAINT "recurring_expenses_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_expenses"
  ADD CONSTRAINT "recurring_expenses_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recurring_expenses"
  ADD CONSTRAINT "recurring_expenses_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recurring_expenses"
  ADD CONSTRAINT "recurring_expenses_deleted_by_user_id_fkey"
  FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ledger entries
CREATE TABLE "ledger_entries" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "entry_date" DATE NOT NULL,
  "account_type" "ledger_account_type" NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" UUID NOT NULL,
  "client_id" UUID,
  "vendor_id" UUID,
  "debit" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "credit" DECIMAL(14, 2) NOT NULL DEFAULT 0,
  "balance_after" DECIMAL(14, 2),
  "description" TEXT,
  "reference_type" TEXT,
  "reference_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL,
  "created_by_user_id" UUID,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_ledger_entries_scope_client_date"
  ON "ledger_entries" ("tenant_id", "workspace_id", "client_id", "entry_date");
CREATE INDEX "idx_ledger_entries_scope_vendor_date"
  ON "ledger_entries" ("tenant_id", "workspace_id", "vendor_id", "entry_date");
CREATE INDEX "idx_ledger_entries_scope_account_date"
  ON "ledger_entries" ("tenant_id", "workspace_id", "account_type", "entry_date");
CREATE INDEX "idx_ledger_entries_scope_entity"
  ON "ledger_entries" ("tenant_id", "workspace_id", "entity_type", "entity_id");

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "platform_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
