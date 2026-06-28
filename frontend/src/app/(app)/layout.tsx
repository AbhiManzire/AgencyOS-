import { AppShell } from '@/components/app-shell';
import { QueryProvider } from '@/lib/api/query-provider';

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <AppShell>{children}</AppShell>
    </QueryProvider>
  );
}
