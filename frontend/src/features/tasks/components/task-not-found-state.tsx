import { FileSearch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer } from '@/design-system';

export function TaskNotFoundState() {
  return (
    <PageContainer size="lg">
      <EmptyState
        icon={FileSearch}
        title="Task not found"
        description="This task may have been removed or you may not have access to it."
        action={
          <Button variant="outline" asChild>
            <Link href="/tasks">Back to Tasks</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
