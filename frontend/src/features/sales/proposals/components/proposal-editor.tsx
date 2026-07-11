'use client';

import { Eye, Loader2, Pencil, Save } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, useToast } from '@/design-system';
import { Caption } from '@/design-system/typography';
import type { ProposalRecord } from '@/features/sales/proposals/api/proposal.types';
import { ProposalPreview } from '@/features/sales/proposals/components/proposal-preview';
import { RichTextEditor } from '@/features/sales/proposals/components/rich-text-editor';
import { SectionList } from '@/features/sales/proposals/components/section-list';
import { VersionBadge } from '@/features/sales/proposals/components/version-badge';
import { useAutosave } from '@/features/sales/proposals/hooks/use-autosave';
import { useUpdateProposal } from '@/features/sales/proposals/hooks/use-update-proposal';
import {
  areProposalSectionsEqual,
  PROPOSAL_SECTION_LABELS,
  type ProposalSectionKey,
  type ProposalSections,
} from '@/features/sales/proposals/proposal-sections';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';

interface ProposalEditorProps {
  readonly proposal: ProposalRecord;
}

export function ProposalEditor({ proposal }: ProposalEditorProps) {
  const { showToast } = useToast();
  const { allowed: canEdit } = usePermission('proposals.update');
  const { mutateAsync: updateProposal, isPending } = useUpdateProposal(proposal.id);

  const [title, setTitle] = useState(proposal.title);
  const [sections, setSections] = useState<ProposalSections>(proposal.sections);
  const [amount, setAmount] = useState(proposal.amount !== null ? String(proposal.amount) : '');
  const [tax, setTax] = useState(proposal.tax !== null ? String(proposal.tax) : '');
  const [discount, setDiscount] = useState(
    proposal.discount !== null ? String(proposal.discount) : '',
  );
  const [validUntil, setValidUntil] = useState(
    proposal.validUntil !== null ? proposal.validUntil.slice(0, 10) : '',
  );
  const [activeSection, setActiveSection] = useState<ProposalSectionKey>('cover');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [serverSnapshot, setServerSnapshot] = useState({
    title: proposal.title,
    sections: proposal.sections,
    amount: proposal.amount !== null ? String(proposal.amount) : '',
    tax: proposal.tax !== null ? String(proposal.tax) : '',
    discount: proposal.discount !== null ? String(proposal.discount) : '',
    validUntil: proposal.validUntil !== null ? proposal.validUntil.slice(0, 10) : '',
    version: proposal.version,
  });

  useEffect(() => {
    setTitle(proposal.title);
    setSections(proposal.sections);
    setAmount(proposal.amount !== null ? String(proposal.amount) : '');
    setTax(proposal.tax !== null ? String(proposal.tax) : '');
    setDiscount(proposal.discount !== null ? String(proposal.discount) : '');
    setValidUntil(proposal.validUntil !== null ? proposal.validUntil.slice(0, 10) : '');
    setServerSnapshot({
      title: proposal.title,
      sections: proposal.sections,
      amount: proposal.amount !== null ? String(proposal.amount) : '',
      tax: proposal.tax !== null ? String(proposal.tax) : '',
      discount: proposal.discount !== null ? String(proposal.discount) : '',
      validUntil: proposal.validUntil !== null ? proposal.validUntil.slice(0, 10) : '',
      version: proposal.version,
    });
  }, [proposal]);

  const isDirty = useMemo(
    () =>
      title !== serverSnapshot.title ||
      !areProposalSectionsEqual(sections, serverSnapshot.sections) ||
      amount !== serverSnapshot.amount ||
      tax !== serverSnapshot.tax ||
      discount !== serverSnapshot.discount ||
      validUntil !== serverSnapshot.validUntil,
    [
      amount,
      discount,
      sections,
      serverSnapshot.amount,
      serverSnapshot.discount,
      serverSnapshot.sections,
      serverSnapshot.tax,
      serverSnapshot.title,
      serverSnapshot.validUntil,
      tax,
      title,
      validUntil,
    ],
  );

  const commercialPayload = useCallback(() => {
    return {
      amount: amount.trim().length > 0 ? Number(amount) : null,
      tax: tax.trim().length > 0 ? Number(tax) : null,
      discount: discount.trim().length > 0 ? Number(discount) : null,
      validUntil: validUntil.trim().length > 0 ? validUntil : null,
    };
  }, [amount, discount, tax, validUntil]);

  const saveDraft = useCallback(async (): Promise<void> => {
    if (!canEdit || !isDirty) {
      return;
    }

    const updated = await updateProposal({
      title,
      sections,
      ...commercialPayload(),
    });

    setServerSnapshot({
      title: updated.title,
      sections: updated.sections,
      amount: updated.amount !== null ? String(updated.amount) : '',
      tax: updated.tax !== null ? String(updated.tax) : '',
      discount: updated.discount !== null ? String(updated.discount) : '',
      validUntil: updated.validUntil !== null ? updated.validUntil.slice(0, 10) : '',
      version: updated.version,
    });
  }, [canEdit, commercialPayload, isDirty, sections, title, updateProposal]);

  const { state: autosaveState } = useAutosave({
    enabled: canEdit && mode === 'edit',
    isDirty,
    onSave: saveDraft,
  });

  const handleSaveVersion = async (): Promise<void> => {
    try {
      if (isDirty) {
        await saveDraft();
      }

      const updated = await updateProposal({ incrementVersion: true });
      setServerSnapshot({
        title: updated.title,
        sections: updated.sections,
        amount: updated.amount !== null ? String(updated.amount) : '',
        tax: updated.tax !== null ? String(updated.tax) : '',
        discount: updated.discount !== null ? String(updated.discount) : '',
        validUntil: updated.validUntil !== null ? updated.validUntil.slice(0, 10) : '',
        version: updated.version,
      });
      showToast(`Saved as version ${String(updated.version)}`, 'success');
    } catch (saveError) {
      showToast(extractApiErrorMessage(saveError), 'error');
    }
  };

  const updateSectionContent = (section: ProposalSectionKey, content: string): void => {
    setSections((current) => ({
      ...current,
      [section]: content,
    }));
  };

  const autosaveLabel =
    autosaveState === 'pending'
      ? 'Unsaved changes'
      : autosaveState === 'saving' || isPending
        ? 'Saving...'
        : autosaveState === 'saved'
          ? 'All changes saved'
          : autosaveState === 'error'
            ? 'Save failed'
            : 'Ready';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={title}
              disabled={!canEdit || mode === 'preview'}
              className="max-w-xl text-lg font-semibold"
              aria-label="Proposal title"
              onChange={(event) => {
                setTitle(event.target.value);
              }}
            />
            <VersionBadge version={serverSnapshot.version} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{proposal.dealTitle}</span>
            {proposal.quoteTitle ? <span>· {proposal.quoteTitle}</span> : null}
            <Caption className="text-muted-foreground">{autosaveLabel}</Caption>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={mode === 'preview' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => {
              setMode((current) => (current === 'edit' ? 'preview' : 'edit'));
            }}
          >
            {mode === 'preview' ? <Pencil className="size-4" /> : <Eye className="size-4" />}
            {mode === 'preview' ? 'Edit' : 'Preview'}
          </Button>
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isPending}
              onClick={() => {
                void handleSaveVersion();
              }}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              New Version
            </Button>
          ) : null}
          <Button type="button" variant="ghost" asChild>
            <Link href={`/sales/deals/${proposal.dealId}`}>Back to deal</Link>
          </Button>
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label htmlFor="proposal-amount" className="text-sm font-medium">
              Amount
            </label>
            <Input
              id="proposal-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              disabled={!canEdit}
              onChange={(event) => {
                setAmount(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proposal-tax" className="text-sm font-medium">
              Tax
            </label>
            <Input
              id="proposal-tax"
              type="number"
              min={0}
              step="0.01"
              value={tax}
              disabled={!canEdit}
              onChange={(event) => {
                setTax(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proposal-discount" className="text-sm font-medium">
              Discount
            </label>
            <Input
              id="proposal-discount"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              disabled={!canEdit}
              onChange={(event) => {
                setDiscount(event.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proposal-valid-until" className="text-sm font-medium">
              Valid until
            </label>
            <Input
              id="proposal-valid-until"
              type="date"
              value={validUntil}
              disabled={!canEdit}
              onChange={(event) => {
                setValidUntil(event.target.value);
              }}
            />
          </div>
        </div>
      ) : null}

      {mode === 'preview' ? (
        <ProposalPreview title={title} sections={sections} quoteId={proposal.quoteId} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-border bg-card p-3">
            <SectionList activeSection={activeSection} onSelectSection={setActiveSection} />
          </aside>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{PROPOSAL_SECTION_LABELS[activeSection]}</h2>
            <RichTextEditor
              value={sections[activeSection]}
              disabled={!canEdit}
              placeholder={`Write the ${PROPOSAL_SECTION_LABELS[activeSection].toLowerCase()} section...`}
              onChange={(content) => {
                updateSectionContent(activeSection, content);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProposalEditorLoader({
  isLoading,
  error,
  proposal,
  onRetry,
}: {
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly proposal?: ProposalRecord;
  readonly onRetry: () => void;
}) {
  if (isLoading) {
    return <LoadingState label="Loading proposal..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (!proposal) {
    return <ErrorState message="Proposal not found." />;
  }

  return <ProposalEditor proposal={proposal} />;
}
