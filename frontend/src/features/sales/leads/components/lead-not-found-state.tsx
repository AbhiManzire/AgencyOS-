'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function LeadNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        title="Lead not found"
        description="This lead may have been deleted or you do not have access."
        action={
          <Button asChild variant="outline">
            <Link href="/sales/leads">Back to leads</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
