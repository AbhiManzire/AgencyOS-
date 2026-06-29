import { AppShell } from '@/components/app-shell';
import { ErrorBoundary } from '@/components/error-boundary';
import { ToastProvider } from '@/design-system';
import { QueryProvider } from '@/lib/api/query-provider';
import { SessionTimeoutHandler } from '@/lib/auth/session-timeout';
import { PermissionProvider } from '@/lib/rbac';

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <PermissionProvider>
        <ToastProvider>
          <ErrorBoundary>
            <SessionTimeoutHandler />
            <AppShell>{children}</AppShell>
          </ErrorBoundary>
        </ToastProvider>
      </PermissionProvider>
    </QueryProvider>
  );
}
