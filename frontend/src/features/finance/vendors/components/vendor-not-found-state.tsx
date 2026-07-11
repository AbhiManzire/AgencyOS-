'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function VendorNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        title="Vendor not found"
        description="This vendor may have been deleted or you do not have access."
        action={
          <Button asChild variant="outline">
            <Link href="/finance/vendors">Back to vendors</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
