'use client';

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export default function NotFoundPage() {
  return (
    <PageContainer size="md">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for does not exist or may have been moved."
        action={
          <Button asChild>
            <Link href="/">Go to dashboard</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
