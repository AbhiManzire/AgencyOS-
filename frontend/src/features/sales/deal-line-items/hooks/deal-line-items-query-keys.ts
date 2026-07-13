export const dealLineItemsQueryKeys = {
  all: ['deal-line-items'] as const,
  list: (dealId: string) => [...dealLineItemsQueryKeys.all, 'list', dealId] as const,
};
