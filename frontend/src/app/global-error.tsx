'use client';

import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

interface GlobalErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PageContainer size="md">
          <EmptyState
            icon={AlertOctagon}
            title="Application error"
            description={
              error.message || 'A critical error occurred. Please reload the application.'
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" onClick={reset}>
                  Try again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reload application
                </Button>
              </div>
            }
          />
        </PageContainer>
      </body>
    </html>
  );
}
