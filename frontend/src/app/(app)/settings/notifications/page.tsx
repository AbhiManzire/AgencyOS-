'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/design-system';
import { ClientListPagination } from '@/features/clients/components/client-list-pagination';
import {
  useArchiveNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/hooks/use-notifications';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { PermissionRoute } from '@/lib/rbac';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function NotificationsInboxContent() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [message, setMessage] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      isRead: filter === 'all' ? undefined : filter === 'read',
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    [filter, page, pageSize],
  );

  const listQuery = useNotifications(params);
  const unreadQuery = useUnreadNotificationCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();
  const archiveMutation = useArchiveNotification();

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const unreadCount = unreadQuery.data?.count ?? 0;

  if (listQuery.isLoading) {
    return <LoadingState label="Loading notifications..." />;
  }

  if (listQuery.isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(listQuery.error)}
        action={
          <Button type="button" variant="outline" onClick={() => void listQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`In-app inbox${unreadCount > 0 ? ` · ${String(unreadCount)} unread` : ''}.`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <NativeSelect
          label="Filter"
          value={filter}
          onChange={(event) => {
            setPage(1);
            setFilter(event.target.value as 'all' | 'unread' | 'read');
          }}
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </NativeSelect>

        <Button
          type="button"
          variant="outline"
          disabled={markAllMutation.isPending || unreadCount === 0}
          onClick={() => {
            setMessage(null);
            markAllMutation.mutate(undefined, {
              onSuccess: () => {
                setMessage('All notifications marked as read.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            });
          }}
        >
          {markAllMutation.isPending ? 'Marking…' : 'Mark all read'}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No notifications" description="Your inbox is empty for this filter." />
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className={
                  item.isRead
                    ? 'rounded-lg border border-border p-4'
                    : 'rounded-lg border border-border bg-muted/30 p-4'
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{item.title}</h2>
                      {!item.isRead ? (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.category} · {formatDate(item.createdAt)}
                    </p>
                    {item.linkPath ? (
                      <Link
                        href={item.linkPath}
                        className="mt-2 inline-block text-sm text-primary hover:underline"
                      >
                        Open related item
                      </Link>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!item.isRead ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={markReadMutation.isPending}
                        onClick={() => {
                          setMessage(null);
                          markReadMutation.mutate(item.id, {
                            onError: (err) => {
                              setMessage(extractApiErrorMessage(err));
                            },
                          });
                        }}
                      >
                        Mark read
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={archiveMutation.isPending}
                      onClick={() => {
                        setMessage(null);
                        archiveMutation.mutate(item.id, {
                          onSuccess: () => {
                            setMessage('Notification archived.');
                          },
                          onError: (err) => {
                            setMessage(extractApiErrorMessage(err));
                          },
                        });
                      }}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <ClientListPagination
              page={page}
              pageSize={pageSize}
              totalItems={total}
              onPageChange={setPage}
              onPageSizeChange={(next) => {
                setPage(1);
                setPageSize(next);
              }}
            />
          </div>
        </>
      )}

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </>
  );
}

export default function NotificationsSettingsPage() {
  return (
    <PermissionRoute permission="notifications.read">
      <NotificationsInboxContent />
    </PermissionRoute>
  );
}
