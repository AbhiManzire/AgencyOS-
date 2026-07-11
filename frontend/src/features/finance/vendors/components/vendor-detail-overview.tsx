import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, Caption, CardTitle } from '@/design-system/typography';
import type { VendorRecord } from '@/features/finance/vendors/api/vendor.types';
import { formatVendorDate } from '@/features/finance/vendors/forms/vendor-form.validation';

interface VendorDetailOverviewProps {
  readonly vendor: VendorRecord;
}

interface OverviewFieldProps {
  readonly label: string;
  readonly value: string;
}

function OverviewField({ label, value }: OverviewFieldProps) {
  return (
    <div className="space-y-1">
      <Caption className="block uppercase tracking-wide">{label}</Caption>
      <Body>{value}</Body>
    </div>
  );
}

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (value.trim().length === 0) {
    return '—';
  }
  return value;
}

export function VendorDetailOverview({ vendor }: VendorDetailOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <OverviewField label="Name" value={vendor.name} />
          <OverviewField label="Code" value={display(vendor.code)} />
          <OverviewField label="Contact" value={display(vendor.contactPerson)} />
          <OverviewField label="Email" value={display(vendor.email)} />
          <OverviewField label="Phone" value={display(vendor.phone)} />
          <OverviewField label="GSTIN" value={display(vendor.gstin)} />
          <OverviewField label="PAN" value={display(vendor.pan)} />
          <OverviewField label="Currency" value={vendor.currency} />
          <OverviewField
            label="Payment terms"
            value={
              vendor.paymentTermsDays !== null ? `${String(vendor.paymentTermsDays)} days` : '—'
            }
          />
          <OverviewField label="Created" value={formatVendorDate(vendor.createdAt)} />
          <OverviewField label="Updated" value={formatVendorDate(vendor.updatedAt)} />
          {vendor.notes ? (
            <div className="space-y-1 sm:col-span-2">
              <Caption className="block uppercase tracking-wide">Notes</Caption>
              <Body className="whitespace-pre-wrap">{vendor.notes}</Body>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
