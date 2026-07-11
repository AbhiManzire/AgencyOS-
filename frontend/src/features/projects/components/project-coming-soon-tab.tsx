'use client';

import { EmptyState } from '@/design-system';

interface ProjectComingSoonTabProps {
  readonly title: string;
  readonly description: string;
}

/** Placeholder for project detail features not yet in this sprint. */
export function ProjectComingSoonTab({ title, description }: ProjectComingSoonTabProps) {
  return <EmptyState title={title} description={description} />;
}
