'use client';

import Link from 'next/link';
import { HeartPulse, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/design-system';
import { ClientSuccessDashboard } from '@/features/clients/success/components/client-success-dashboard';
import { MergeClientsDialog } from '@/features/clients/success/components/merge-clients-dialog';
import { useState } from 'react';
import { Can } from '@/lib/rbac';

export default function ClientSuccessPage() {
  const [mergeOpen, setMergeOpen] = useState(false);

  return (
    <PageContainer size="lg">
      <PageHeader
        title="Client Success"
        description="Health, renewals, and revenue signals for active clients."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Can permission="clients.update">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMergeOpen(true);
                }}
              >
                Merge clients
              </Button>
            </Can>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/clients">
                <Users className="size-4" />
                All clients
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <HeartPulse className="size-4" aria-hidden="true" />
        Dashboard refreshes from live Client Success metrics.
      </div>

      <ClientSuccessDashboard />

      <MergeClientsDialog open={mergeOpen} onOpenChange={setMergeOpen} />
    </PageContainer>
  );
}
