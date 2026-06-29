'use client';

import { Bold, Italic, List, Underline } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  readonly value: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
}

export function RichTextEditor({
  value,
  placeholder = 'Start writing...',
  disabled = false,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor === null || editor.innerHTML === value) {
      return;
    }

    editor.innerHTML = value;
  }, [value]);

  const applyCommand = (command: string): void => {
    if (disabled) {
      return;
    }

    // document.execCommand is deprecated but sufficient for this lightweight editor.
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- intentional for toolbar formatting without a heavy RTE dependency
    document.execCommand(command, false);
    const editor = editorRef.current;
    if (editor !== null) {
      onChange(editor.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/30 p-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label="Bold"
          onClick={() => {
            applyCommand('bold');
          }}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label="Italic"
          onClick={() => {
            applyCommand('italic');
          }}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label="Underline"
          onClick={() => {
            applyCommand('underline');
          }}
        >
          <Underline className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={disabled}
          aria-label="Bullet list"
          onClick={() => {
            applyCommand('insertUnorderedList');
          }}
        >
          <List className="size-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text editor"
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          'min-h-[280px] rounded-lg border border-border bg-card p-4 text-sm leading-relaxed outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring',
          'empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        onInput={(event) => {
          onChange(event.currentTarget.innerHTML);
        }}
      />
    </div>
  );
}
