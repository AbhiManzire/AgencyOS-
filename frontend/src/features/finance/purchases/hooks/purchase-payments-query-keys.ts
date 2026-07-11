export const purchasePaymentsQueryKeys = {
  all: ['purchasePayments'] as const,
  bill: (billId: string) => [...purchasePaymentsQueryKeys.all, 'bill', billId] as const,
  detail: (id: string) => [...purchasePaymentsQueryKeys.all, 'detail', id] as const,
};
