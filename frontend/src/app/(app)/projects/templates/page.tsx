'use client';

import Link from 'next/link';
import { FolderKanban, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/design-system';
import { ProjectTemplatesList } from '@/features/projects/templates/components/project-templates-list';

export default function ProjectTemplatesPage() {
  return (
    <PageContainer size="lg">
      <PageHeader
        title="Project templates"
        description="Standardize delivery blueprints by service type."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/projects/delivery">
                <FolderKanban className="size-4" />
                Delivery
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/projects">
                <LayoutTemplate className="size-4" />
                All projects
              </Link>
            </Button>
          </div>
        }
      />

      <ProjectTemplatesList />
    </PageContainer>
  );
}
