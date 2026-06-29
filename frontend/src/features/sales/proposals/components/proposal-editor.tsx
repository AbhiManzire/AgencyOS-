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
  const [activeSection, setActiveSection] = useState<ProposalSectionKey>('cover');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [serverSnapshot, setServerSnapshot] = useState({
    title: proposal.title,
    sections: proposal.sections,
    version: proposal.version,
  });

  useEffect(() => {
    setTitle(proposal.title);
    setSections(proposal.sections);
    setServerSnapshot({
      title: proposal.title,
      sections: proposal.sections,
      version: proposal.version,
    });
  }, [proposal]);

  const isDirty = useMemo(
    () =>
      title !== serverSnapshot.title ||
      !areProposalSectionsEqual(sections, serverSnapshot.sections),
    [sections, serverSnapshot.sections, serverSnapshot.title, title],
  );

  const saveDraft = useCallback(async (): Promise<void> => {
    if (!canEdit || !isDirty) {
      return;
    }

    const updated = await updateProposal({
      title,
      sections,
    });

    setServerSnapshot({
      title: updated.title,
      sections: updated.sections,
      version: updated.version,
    });
  }, [canEdit, isDirty, sections, title, updateProposal]);

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
