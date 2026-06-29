import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function InvoiceNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={Receipt}
        title="Invoice not found"
        description="This invoice may have been removed or you may not have access."
        action={
          <Button variant="outline" asChild>
            <Link href="/finance/invoices">Back to invoices</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
