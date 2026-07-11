import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function PurchaseBillNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={ShoppingBag}
        title="Purchase bill not found"
        description="This bill may have been removed or you may not have access."
        action={
          <Button variant="outline" asChild>
            <Link href="/finance/purchases">Back to purchases</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
