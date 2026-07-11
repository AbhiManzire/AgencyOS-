import type { ListRecurringParams } from '@/features/finance/recurring/api/recurring.types';

export const recurringInvoicesQueryKeys = {
  all: ['recurring-invoices'] as const,
  list: (params: ListRecurringParams) =>
    [...recurringInvoicesQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...recurringInvoicesQueryKeys.all, 'detail', id] as const,
};

export const recurringExpensesQueryKeys = {
  all: ['recurring-expenses'] as const,
  list: (params: ListRecurringParams) =>
    [...recurringExpensesQueryKeys.all, 'list', params] as const,
  detail: (id: string) => [...recurringExpensesQueryKeys.all, 'detail', id] as const,
};

export const recurringRunQueryKeys = {
  all: ['recurring-run'] as const,
};
