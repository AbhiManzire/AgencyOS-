'use client';

import { GitBranch, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { CreateWorkflowDrawer } from '@/features/workflows/components/create-workflow-drawer';
import { WorkflowListTable } from '@/features/workflows/components/workflow-list-table';
import { useWorkflows } from '@/features/workflows/hooks/use-workflows';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function WorkflowsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const pageSize = 10;

  const listParams = useMemo(
    () => ({
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    [page],
  );

  const { data, isLoading, error, refetch, isFetching } = useWorkflows(listParams);

  const filteredWorkflows = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return data.items;
    }

    return data.items.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(query) ||
        (workflow.description?.toLowerCase().includes(query) ?? false),
    );
  }, [data, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const hasActiveFilters = search.trim().length > 0;

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Workflows"
        description="Automate actions when key events occur in your workspace"
        actions={
          <Can permission="workflows.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Workflow
            </Button>
          </Can>
        }
      />

      <CreateWorkflowDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Input
            type="search"
            placeholder="Search workflows..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search workflows"
          />
        </div>

        {error ? (
          <ErrorState
            message={extractApiErrorMessage(error)}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading workflows..." />
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title={hasActiveFilters ? 'No workflows match your search' : 'No workflows yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria.'
                : 'Create your first workflow to automate repetitive tasks.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                  }}
                >
                  Clear search
                </Button>
              ) : (
                <Can permission="workflows.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Workflow
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <WorkflowListTable workflows={filteredWorkflows} />
            {search.trim().length === 0 && data && data.total > pageSize ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                  {isFetching ? ' · Updating...' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((current) => Math.max(1, current - 1));
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage((current) => current + 1);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageContainer>
  );
}
