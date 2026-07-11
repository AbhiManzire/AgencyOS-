import type { PurchaseBillRecord } from '@/features/finance/purchases/api/purchase-bill.types';
import type { PurchaseBillListItem } from '@/features/finance/purchases/types';

export function purchaseBillRecordToListItem(
  record: PurchaseBillRecord,
  vendorName = '',
): PurchaseBillListItem {
  return {
    id: record.id,
    vendorId: record.vendorId,
    vendorName,
    billNumber: record.billNumber,
    status: record.status,
    issueDate: record.issueDate,
    dueDate: record.dueDate,
    currency: record.currency,
    grandTotal: record.grandTotal,
    balanceDue: record.balanceDue,
    updatedAt: record.updatedAt,
  };
}
