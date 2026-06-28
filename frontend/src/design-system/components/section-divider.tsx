import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { typographyStyles } from '@/design-system/typography/typography';

interface SectionDividerProps {
  title?: string;
  className?: string;
}

/** Visual separator between page sections with optional label. */
export function SectionDivider({ title, className }: SectionDividerProps) {
  if (!title) {
    return <Separator className={cn('my-6', className)} />;
  }

  return (
    <div className={cn('my-6 flex items-center gap-4', className)}>
      <Separator className="flex-1" />
      <span className={cn(typographyStyles.sectionTitle, 'shrink-0 text-muted-foreground')}>
        {title}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
