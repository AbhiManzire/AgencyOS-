'use client';

import { Loader2, Plus, RefreshCw, Repeat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { CreateRecurringDrawer } from '@/features/finance/recurring/components/create-recurring-drawer';
import { RecurringListTable } from '@/features/finance/recurring/components/recurring-list-table';
import {
  RecurringPageTabs,
  type RecurringPageTab,
} from '@/features/finance/recurring/components/recurring-page-tabs';
import { useRecurringExpenses } from '@/features/finance/recurring/hooks/use-recurring-expenses';
import { useRecurringInvoices } from '@/features/finance/recurring/hooks/use-recurring-invoices';
import { useRunDueRecurring } from '@/features/finance/recurring/hooks/use-run-due-recurring';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const LIST_PARAMS = { skip: 0, take: 100 } as const;

export default function RecurringPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<RecurringPageTab>('invoices');
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const invoicesQuery = useRecurringInvoices(LIST_PARAMS, {
    enabled: activeTab === 'invoices',
  });
  const expensesQuery = useRecurringExpenses(LIST_PARAMS, {
    enabled: activeTab === 'expenses',
  });
  const { mutateAsync: runDue, isPending: isRunningDue } = useRunDueRecurring();

  const activeQuery = activeTab === 'invoices' ? invoicesQuery : expensesQuery;
  const items = useMemo(() => activeQuery.data?.items ?? [], [activeQuery.data?.items]);

  const createLabel =
    activeTab === 'invoices' ? 'Create recurring invoice' : 'Create recurring expense';
  const emptyTitle =
    activeTab === 'invoices' ? 'No recurring invoices yet' : 'No recurring expenses yet';
  const emptyDescription =
    activeTab === 'invoices'
      ? 'Create a recurring invoice schedule to get started.'
      : 'Create a recurring expense schedule to get started.';

  const handleRunDue = async (): Promise<void> => {
    try {
      const result = await runDue();
      showToast(
        `Advanced ${String(result.invoicesAdvanced)} invoice(s) and ${String(result.expensesAdvanced)} expense(s)`,
        'success',
      );
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Recurring"
        description="Schedule recurring invoices and expenses for this workspace"
        actions={
          <div className="flex flex-wrap gap-2">
            <Can permission="finance.recurring.update">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={isRunningDue}
                onClick={() => {
                  void handleRunDue();
                }}
              >
                {isRunningDue ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Run due
              </Button>
            </Can>
            <Can permission="finance.recurring.create">
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  setCreateDrawerOpen(true);
                }}
              >
                <Plus className="size-4" />
                {createLabel}
              </Button>
            </Can>
          </div>
        }
      />

      <CreateRecurringDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        kind={activeTab === 'invoices' ? 'invoice' : 'expense'}
      />

      <div className="space-y-4">
        <RecurringPageTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setCreateDrawerOpen(false);
          }}
        />

        {activeQuery.error ? (
          <ErrorState
            message={extractApiErrorMessage(activeQuery.error)}
            action={
              <Button variant="outline" onClick={() => void activeQuery.refetch()}>
                Try again
              </Button>
            }
          />
        ) : activeQuery.isLoading ? (
          <LoadingState
            label={
              activeTab === 'invoices'
                ? 'Loading recurring invoices...'
                : 'Loading recurring expenses...'
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title={emptyTitle}
            description={emptyDescription}
            action={
              <Can permission="finance.recurring.create">
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    setCreateDrawerOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  {createLabel}
                </Button>
              </Can>
            }
          />
        ) : (
          <RecurringListTable items={items} />
        )}
      </div>
    </PageContainer>
  );
}
