import type { PurchaseBillLineItemRecord } from '@/features/finance/purchases/api/purchase-line-item.types';
import type { PurchaseBillLineItemListItem } from '@/features/finance/purchases/types';

export function purchaseLineItemRecordToListItem(
  record: PurchaseBillLineItemRecord,
): PurchaseBillLineItemListItem {
  return {
    id: record.id,
    purchaseBillId: record.purchaseBillId,
    name: record.name,
    description: record.description,
    quantity: record.quantity,
    unit: record.unit,
    unitPrice: record.unitPrice,
    discount: record.discount,
    tax: record.tax,
    total: record.total,
    sortOrder: record.sortOrder,
  };
}
