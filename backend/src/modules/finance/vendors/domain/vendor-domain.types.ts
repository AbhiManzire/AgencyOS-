export interface CreateVendorValidationInput {
  readonly name: string;
  readonly currency?: string;
  readonly paymentTermsDays?: number | null;
}

export interface UpdateVendorValidationInput {
  readonly name?: string;
  readonly currency?: string;
  readonly paymentTermsDays?: number | null;
}
