'use client';

import { Loader2, Play, Square } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, useToast } from '@/design-system';
import { Caption, CardTitle } from '@/design-system/typography';
import { StopTimerDialog } from '@/features/time-entries/components/stop-timer-dialog';
import { useActiveTimeEntry } from '@/features/time-entries/hooks/use-active-time-entry';
import { useLiveTimer } from '@/features/time-entries/hooks/use-live-timer';
import { useStartTimer } from '@/features/time-entries/hooks/use-start-timer';
import { useStopTimer } from '@/features/time-entries/hooks/use-stop-timer';
import { readPersistedActiveTimer } from '@/features/time-entries/utils/active-timer-storage';
import { Can } from '@/lib/rbac';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface TaskTimerControlsProps {
  readonly taskId: string;
}

export function TaskTimerControls({ taskId }: TaskTimerControlsProps) {
  const { showToast } = useToast();
  const { data: activeEntry, isLoading: isActiveLoading } = useActiveTimeEntry();
  const { mutateAsync: startTimer, isPending: isStarting } = useStartTimer(taskId);
  const { mutateAsync: stopTimer, isPending: isStopping } = useStopTimer();

  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

  const persistedTimer = useMemo(() => readPersistedActiveTimer(), []);

  const resolvedActive = useMemo(() => {
    if (activeEntry?.isRunning === true) {
      return activeEntry;
    }

    if (isActiveLoading && persistedTimer !== null) {
      return {
        id: persistedTimer.timeEntryId,
        taskId: persistedTimer.taskId,
        startTime: persistedTimer.startTime,
        isRunning: true as const,
      };
    }

    return null;
  }, [activeEntry, isActiveLoading, persistedTimer]);

  const isRunningOnThisTask = resolvedActive?.taskId === taskId;
  const isRunningOnOtherTask =
    resolvedActive !== null && resolvedActive.taskId !== taskId && resolvedActive.isRunning;

  const liveElapsed = useLiveTimer(
    isRunningOnThisTask ? resolvedActive.startTime : null,
    isRunningOnThisTask,
  );

  const handleStart = async (): Promise<void> => {
    try {
      await startTimer({});
      showToast('Timer started');
    } catch (startError) {
      showToast(extractApiErrorMessage(startError), 'error');
    }
  };

  const handleResume = async (): Promise<void> => {
    if (resolvedActive === null || !isRunningOnOtherTask) {
      return;
    }

    try {
      await stopTimer({
        timeEntryId: resolvedActive.id,
        taskId: resolvedActive.taskId,
      });
      await startTimer({});
      setResumeDialogOpen(false);
      showToast('Timer resumed on this task');
    } catch (resumeError) {
      showToast(extractApiErrorMessage(resumeError), 'error');
    }
  };

  const handleConfirmStop = async (): Promise<void> => {
    if (resolvedActive === null || !isRunningOnThisTask) {
      return;
    }

    try {
      await stopTimer({
        timeEntryId: resolvedActive.id,
        taskId,
      });
      setStopDialogOpen(false);
      showToast('Timer stopped and time entry saved');
    } catch (stopError) {
      showToast(extractApiErrorMessage(stopError), 'error');
    }
  };

  const isPending = isStarting || isStopping || isActiveLoading;

  return (
    <Can permission="time.manage">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Timer</CardTitle>
            <Caption className="text-muted-foreground">
              {isRunningOnThisTask
                ? 'Tracking time on this task.'
                : isRunningOnOtherTask
                  ? 'A timer is running on another task.'
                  : 'Start tracking time on this task.'}
            </Caption>
            {isRunningOnThisTask ? (
              <p className="mt-2 font-mono text-3xl font-semibold tracking-wider tabular-nums">
                {liveElapsed}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {!isRunningOnThisTask && !isRunningOnOtherTask ? (
              <Button
                type="button"
                className="gap-2"
                disabled={isPending}
                onClick={() => {
                  void handleStart();
                }}
              >
                {isStarting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Start Timer
              </Button>
            ) : null}

            {isRunningOnThisTask ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={isPending}
                onClick={() => {
                  setStopDialogOpen(true);
                }}
              >
                <Square className="size-4" />
                Stop Timer
              </Button>
            ) : null}

            {isRunningOnOtherTask ? (
              <Button
                type="button"
                className="gap-2"
                disabled={isPending}
                onClick={() => {
                  setResumeDialogOpen(true);
                }}
              >
                {isStarting || isStopping ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Resume Timer
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <StopTimerDialog
        open={stopDialogOpen}
        elapsed={liveElapsed}
        isPending={isStopping}
        onCancel={() => {
          setStopDialogOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmStop();
        }}
      />

      {resumeDialogOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
          >
            <CardTitle className="mb-2 text-base">Resume timer on this task?</CardTitle>
            <Caption className="mb-6 block text-muted-foreground">
              This will stop the timer on the other task and start a new one here.
            </Caption>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setResumeDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending}
                className="gap-2"
                onClick={() => {
                  void handleResume();
                }}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Resume Timer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Can>
  );
}
