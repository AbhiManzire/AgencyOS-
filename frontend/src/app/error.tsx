'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Route error', error);
  }, [error]);

  return (
    <PageContainer size="md">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="An unexpected error occurred while loading this page."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.assign('/');
              }}
            >
              Go to dashboard
            </Button>
          </div>
        }
      />
    </PageContainer>
  );
}
