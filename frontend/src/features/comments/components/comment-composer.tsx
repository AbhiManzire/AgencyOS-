'use client';

import { Loader2 } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface CommentComposerProps {
  readonly initialMessage?: string;
  readonly submitLabel: string;
  readonly isPending?: boolean;
  readonly onCancel?: () => void;
  readonly onSubmit: (message: string) => Promise<void>;
}

export function CommentComposer({
  initialMessage = '',
  submitLabel,
  isPending = false,
  onCancel,
  onSubmit,
}: CommentComposerProps) {
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSaving = isPending || isSubmitting;

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      setError('Comment cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmed);
      if (onCancel === undefined) {
        setMessage('');
      }
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
      <textarea
        value={message}
        rows={3}
        disabled={isSaving}
        placeholder="Write a comment..."
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        onChange={(event) => {
          setMessage(event.target.value);
          if (error !== null) {
            setError(null);
          }
        }}
      />

      {error !== null ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel !== undefined ? (
          <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
