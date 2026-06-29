'use client';

import { Download, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Caption } from '@/design-system/typography';
import { downloadFile } from '@/features/files/api/files.api';
import type { FileListItem } from '@/features/files/types';
import { formatFileDate, formatFileSize } from '@/features/files/utils/file-display';
import { Can } from '@/lib/rbac';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface FileCardProps {
  readonly file: FileListItem;
  readonly onDelete: () => void;
}

export function FileCard({ file, onDelete }: FileCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (): Promise<void> => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      await downloadFile(file.id, file.originalName);
    } catch (error) {
      setDownloadError(extractApiErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{file.originalName}</p>
          <Caption className="text-muted-foreground">
            {formatFileSize(file.size)} · {file.uploadedBy} · {formatFileDate(file.createdAt)}
          </Caption>
          {downloadError !== null ? (
            <p className="mt-1 text-sm text-danger" role="alert">
              {downloadError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={isDownloading}
          aria-label={`Download ${file.originalName}`}
          onClick={() => {
            void handleDownload();
          }}
        >
          <Download className="size-4" />
        </Button>
        <Can permission="files.manage">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-danger hover:text-danger"
            aria-label={`Delete ${file.originalName}`}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </Can>
      </div>
    </article>
  );
}
