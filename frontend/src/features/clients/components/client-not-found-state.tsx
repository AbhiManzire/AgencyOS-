import { FileSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function ClientNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={FileSearch}
        title="Client not found"
        description="This client may have been removed or you may not have access to it."
        action={
          <Button variant="outline" asChild>
            <Link href="/clients">Back to Clients</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
