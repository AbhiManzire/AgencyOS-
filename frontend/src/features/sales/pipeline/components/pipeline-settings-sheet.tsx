'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ErrorState, LoadingState, SectionTitle, useToast } from '@/design-system';
import { useDefaultPipeline } from '@/features/sales/pipelines/hooks/use-pipelines';
import { useUpdatePipelineStage } from '@/features/sales/pipelines/hooks/use-update-pipeline-stage';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface PipelineSettingsSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

interface StageDraft {
  readonly id: string;
  name: string;
  probability: string;
  colorToken: string;
}

export function PipelineSettingsSheet({ open, onOpenChange }: PipelineSettingsSheetProps) {
  const { showToast } = useToast();
  const { data: pipeline, isLoading, error, refetch } = useDefaultPipeline({ enabled: open });
  const { mutateAsync: updateStage, isPending } = useUpdatePipelineStage();
  const [drafts, setDrafts] = useState<StageDraft[]>([]);
  const [savingStageId, setSavingStageId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || pipeline === undefined) {
      return;
    }

    setDrafts(
      pipeline.stages
        .filter((stage) => stage.deletedAt === null)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((stage) => ({
          id: stage.id,
          name: stage.name,
          probability: String(stage.probability),
          colorToken: stage.colorToken ?? '',
        })),
    );
  }, [open, pipeline]);

  const handleSaveStage = async (stageId: string): Promise<void> => {
    if (pipeline === undefined) {
      return;
    }

    const draft = drafts.find((item) => item.id === stageId);
    if (draft === undefined) {
      return;
    }

    const probability = Number(draft.probability);
    if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
      showToast('Probability must be between 0 and 100', 'error');
      return;
    }

    if (draft.name.trim().length === 0) {
      showToast('Stage name is required', 'error');
      return;
    }

    setSavingStageId(stageId);
    try {
      await updateStage({
        pipelineId: pipeline.id,
        stageId,
        payload: {
          name: draft.name.trim(),
          probability,
          colorToken: draft.colorToken.trim().length > 0 ? draft.colorToken.trim() : null,
        },
      });
      showToast('Stage updated', 'success');
    } catch (saveError) {
      showToast(extractApiErrorMessage(saveError), 'error');
    } finally {
      setSavingStageId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <header className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Pipeline settings</h2>
          <p className="text-sm text-muted-foreground">
            Edit stage labels, probabilities, and colors for the default pipeline.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <LoadingState label="Loading pipeline..." />
          ) : error ? (
            <ErrorState
              message={extractApiErrorMessage(error)}
              action={
                <Button variant="outline" onClick={() => void refetch()}>
                  Try again
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              <SectionTitle className="text-base">
                {pipeline?.name ?? 'Default Pipeline'}
              </SectionTitle>
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="space-y-3 rounded-lg border border-border bg-muted/10 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor={`stage-name-${draft.id}`}
                        className="text-sm font-medium text-foreground"
                      >
                        Label
                      </label>
                      <Input
                        id={`stage-name-${draft.id}`}
                        value={draft.name}
                        disabled={isPending}
                        onChange={(event) => {
                          const value = event.target.value;
                          setDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id ? { ...item, name: value } : item,
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`stage-prob-${draft.id}`}
                        className="text-sm font-medium text-foreground"
                      >
                        Probability (%)
                      </label>
                      <Input
                        id={`stage-prob-${draft.id}`}
                        type="number"
                        min={0}
                        max={100}
                        value={draft.probability}
                        disabled={isPending}
                        onChange={(event) => {
                          const value = event.target.value;
                          setDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id ? { ...item, probability: value } : item,
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`stage-color-${draft.id}`}
                        className="text-sm font-medium text-foreground"
                      >
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`stage-color-${draft.id}`}
                          type="color"
                          value={draft.colorToken || '#6366F1'}
                          disabled={isPending}
                          className="size-9 cursor-pointer rounded border border-input bg-background"
                          onChange={(event) => {
                            const value = event.target.value;
                            setDrafts((current) =>
                              current.map((item) =>
                                item.id === draft.id ? { ...item, colorToken: value } : item,
                              ),
                            );
                          }}
                        />
                        <Input
                          value={draft.colorToken}
                          disabled={isPending}
                          placeholder="#3B82F6"
                          onChange={(event) => {
                            const value = event.target.value;
                            setDrafts((current) =>
                              current.map((item) =>
                                item.id === draft.id ? { ...item, colorToken: value } : item,
                              ),
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      className="gap-2"
                      disabled={isPending}
                      onClick={() => {
                        void handleSaveStage(draft.id);
                      }}
                    >
                      {savingStageId === draft.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : null}
                      Save
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
