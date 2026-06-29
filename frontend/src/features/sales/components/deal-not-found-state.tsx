import { FileSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function DealNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={FileSearch}
        title="Deal not found"
        description="This deal may have been removed or you may not have access to it."
        action={
          <Button variant="outline" asChild>
            <Link href="/sales/pipeline">Back to Pipeline</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
