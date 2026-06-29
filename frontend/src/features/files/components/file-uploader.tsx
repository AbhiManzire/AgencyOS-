'use client';

import { Loader2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface FileUploaderProps {
  readonly isPending?: boolean;
  readonly onUpload: (file: File) => Promise<void>;
}

export function FileUploader({ isPending = false, onUpload }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isBusy = isPending || isUploading;

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file === undefined) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(file);
    } catch (uploadError) {
      setError(extractApiErrorMessage(uploadError));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={isBusy}
        onChange={(event) => {
          void handleSelect(event);
        }}
      />
      <Button
        type="button"
        className="gap-2"
        disabled={isBusy}
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        Upload File
      </Button>
      {error !== null ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
