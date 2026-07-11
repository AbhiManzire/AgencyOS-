'use client';

import { CalendarDays, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { TaskFormDrawer } from '@/features/tasks/components/task-form-drawer';
import { TaskCalendarMonth } from '@/features/tasks/calendar/components/task-calendar-month';
import { TaskViewSwitcher } from '@/features/tasks/kanban/components/task-view-switcher';
import { useTasks } from '@/features/tasks/hooks/use-tasks';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

function toDateOnlyIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

export default function TasksCalendarPage() {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const listParams = useMemo(() => {
    const dueFrom = new Date(month.getFullYear(), month.getMonth(), 1);
    const dueTo = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return {
      skip: 0,
      take: 100,
      dueFrom: toDateOnlyIso(dueFrom),
      dueTo: toDateOnlyIso(dueTo),
      sortBy: 'dueDate' as const,
      sortOrder: 'asc' as const,
    };
  }, [month]);

  const { data, isLoading, error, refetch } = useTasks(listParams);
  const tasks = data?.items ?? [];
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Tasks"
        description="Calendar view of tasks by due date"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TaskViewSwitcher />
            <Can permission="tasks.create">
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  setDrawerOpen(true);
                }}
              >
                <Plus className="size-4" />
                New Task
              </Button>
            </Can>
          </div>
        }
      />

      <TaskFormDrawer open={drawerOpen} mode="create" onOpenChange={setDrawerOpen} />

      <div className="space-y-4">
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading calendar..." />
        ) : (
          <>
            <TaskCalendarMonth tasks={tasks} month={month} onMonthChange={setMonth} />
            {tasks.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No tasks due this month"
                description="Tasks with due dates in the selected month will appear on the calendar."
              />
            ) : null}
          </>
        )}
      </div>
    </PageContainer>
  );
}
