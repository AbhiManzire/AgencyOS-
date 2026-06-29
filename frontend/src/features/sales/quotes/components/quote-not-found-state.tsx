import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function QuoteNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={FileText}
        title="Quote not found"
        description="This quote may have been removed or you may not have access."
        action={
          <Button variant="outline" asChild>
            <Link href="/sales/quotes">Back to quotes</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
