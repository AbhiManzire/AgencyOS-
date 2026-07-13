'use client';

import Link from 'next/link';
import { Briefcase, FolderKanban, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/design-system';
import { ProjectDeliveryDashboard } from '@/features/projects/delivery/components/project-delivery-dashboard';

export default function ProjectDeliveryPage() {
  return (
    <PageContainer size="lg">
      <PageHeader
        title="Delivery"
        description="Active delivery health, utilization, and upcoming milestones."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/projects/templates">
                <LayoutTemplate className="size-4" />
                Templates
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/projects">
                <Briefcase className="size-4" />
                All projects
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <FolderKanban className="size-4" aria-hidden="true" />
        Live delivery metrics for the active workspace.
      </div>

      <ProjectDeliveryDashboard />
    </PageContainer>
  );
}
