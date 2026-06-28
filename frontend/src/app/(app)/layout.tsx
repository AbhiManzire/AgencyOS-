import { AppShell } from '@/components/app-shell';
import { ToastProvider } from '@/design-system';
import { QueryProvider } from '@/lib/api/query-provider';

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </QueryProvider>
  );
}
