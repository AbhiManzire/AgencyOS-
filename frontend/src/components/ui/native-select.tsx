import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

/** Styled native select for toolbar filters. */
export function NativeSelect({ className, label, id, children, ...props }: NativeSelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(
          'ds-focus-ring h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
