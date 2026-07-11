-- AlterTable
ALTER TABLE "clients" ADD COLUMN "client_code" TEXT,
ADD COLUMN "gstin" TEXT,
ADD COLUMN "pan" TEXT,
ADD COLUMN "currency" CHAR(3),
ADD COLUMN "shipping_address_line_1" TEXT,
ADD COLUMN "shipping_address_line_2" TEXT,
ADD COLUMN "shipping_city" TEXT,
ADD COLUMN "shipping_state_region" TEXT,
ADD COLUMN "shipping_postal_code" TEXT,
ADD COLUMN "shipping_country_code" CHAR(2);

-- CreateIndex
CREATE UNIQUE INDEX "uq_clients_tenant_id_workspace_id_client_code" ON "clients"("tenant_id", "workspace_id", "client_code");
