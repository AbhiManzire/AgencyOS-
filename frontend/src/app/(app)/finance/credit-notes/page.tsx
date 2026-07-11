'use client';

import { FileMinus2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { ApplyCreditNoteDialog } from '@/features/finance/credit-notes/components/apply-credit-note-dialog';
import { CreateCreditNoteDrawer } from '@/features/finance/credit-notes/components/create-credit-note-drawer';
import { CreditNoteListTable } from '@/features/finance/credit-notes/components/credit-note-list-table';
import { VoidCreditNoteDialog } from '@/features/finance/credit-notes/components/void-credit-note-dialog';
import { useCreditNotes } from '@/features/finance/credit-notes/hooks/use-credit-notes';
import { useVoidCreditNote } from '@/features/finance/credit-notes/hooks/use-void-credit-note';
import type { CreditNoteListItem } from '@/features/finance/credit-notes/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';
import { usePermission } from '@/lib/rbac/use-permission';

const LIST_FETCH_TAKE = 100;

export default function CreditNotesPage() {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('finance.credit_notes.update');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [applyNote, setApplyNote] = useState<CreditNoteListItem | null>(null);
  const [voidNote, setVoidNote] = useState<CreditNoteListItem | null>(null);
  const pageSize = 10;

  const listParams = useMemo(
    () => ({
      skip: 0,
      take: LIST_FETCH_TAKE,
    }),
    [],
  );

  const { data, isLoading, error, refetch, isFetching } = useCreditNotes(listParams);
  const { mutateAsync: voidCreditNote, isPending: isVoiding } = useVoidCreditNote();

  const matchingNotes = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return data.items;
    }

    return data.items.filter(
      (note) =>
        note.creditNoteNumber.toLowerCase().includes(query) ||
        note.clientName.toLowerCase().includes(query),
    );
  }, [data, search]);

  const filteredNotes = useMemo(() => {
    const start = (page - 1) * pageSize;
    return matchingNotes.slice(start, start + pageSize);
  }, [matchingNotes, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(matchingNotes.length / pageSize));
  const hasActiveFilters = search.trim().length > 0;

  const handleConfirmVoid = async (): Promise<void> => {
    if (voidNote === null) {
      return;
    }

    try {
      await voidCreditNote(voidNote.id);
      showToast('Credit note voided', 'success');
      setVoidNote(null);
    } catch (voidError) {
      showToast(extractApiErrorMessage(voidError), 'error');
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Credit Notes"
        description="Issue and apply credit notes against client invoices"
        actions={
          <Can permission="finance.credit_notes.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Credit Note
            </Button>
          </Can>
        }
      />

      <CreateCreditNoteDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />
      <ApplyCreditNoteDialog
        open={applyNote !== null}
        note={applyNote}
        onOpenChange={(open) => {
          if (!open) {
            setApplyNote(null);
          }
        }}
      />
      <VoidCreditNoteDialog
        open={voidNote !== null}
        creditNoteNumber={voidNote?.creditNoteNumber ?? ''}
        isPending={isVoiding}
        onCancel={() => {
          setVoidNote(null);
        }}
        onConfirm={() => {
          void handleConfirmVoid();
        }}
      />

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Input
            type="search"
            placeholder="Search credit notes..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label="Search credit notes"
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
          <LoadingState label="Loading credit notes..." />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            icon={FileMinus2}
            title={hasActiveFilters ? 'No credit notes match your search' : 'No credit notes yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search criteria.'
                : 'Create your first credit note to get started.'
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
                <Can permission="finance.credit_notes.create">
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create Credit Note
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <CreditNoteListTable
              notes={filteredNotes}
              canManage={canManage}
              onApply={setApplyNote}
              onVoid={setVoidNote}
            />
            {matchingNotes.length > pageSize ? (
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
