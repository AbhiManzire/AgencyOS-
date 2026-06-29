import { FileSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function ProjectNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={FileSearch}
        title="Project not found"
        description="This project may have been removed or you may not have access to it."
        action={
          <Button variant="outline" asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
