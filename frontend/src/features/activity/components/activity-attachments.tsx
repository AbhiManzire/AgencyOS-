'use client';

import { Download, FolderOpen, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { Caption } from '@/design-system/typography';
import { downloadFile } from '@/features/files/api/files.api';
import { FileUploader } from '@/features/files/components/file-uploader';
import { useFiles } from '@/features/files/hooks/use-files';
import { useUploadFile } from '@/features/files/hooks/use-upload-file';
import { formatFileDate, formatFileSize } from '@/features/files/utils/file-display';
import { Can } from '@/lib/rbac';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ActivityAttachmentsProps {
  readonly activityId: string;
}

/** List and upload attachments for an activity (no delete UI). */
export function ActivityAttachments({ activityId }: ActivityAttachmentsProps) {
  const { showToast } = useToast();
  const entityParams = { entityType: 'activity', entityId: activityId };
  const { data: files = [], isLoading, error, refetch } = useFiles(entityParams);
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile(entityParams);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleUpload = async (file: File): Promise<void> => {
    await uploadFile(file);
    showToast('File uploaded successfully');
  };

  const handleDownload = async (fileId: string, originalName: string): Promise<void> => {
    setDownloadingId(fileId);
    try {
      await downloadFile(fileId, originalName);
    } catch (downloadError) {
      showToast(extractApiErrorMessage(downloadError), 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading attachments..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <Can permission="files.manage">
        <FileUploader isPending={isUploading} onUpload={handleUpload} />
      </Can>

      {files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No attachments"
          description="Upload files related to this activity."
        />
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-background p-3"
            >
              <div className="flex min-w-0 flex-1 gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.originalName}
                  </p>
                  <Caption className="text-muted-foreground">
                    {formatFileSize(file.size)} · {file.uploadedBy} ·{' '}
                    {formatFileDate(file.createdAt)}
                  </Caption>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                disabled={downloadingId === file.id}
                aria-label={`Download ${file.originalName}`}
                onClick={() => {
                  void handleDownload(file.id, file.originalName);
                }}
              >
                <Download className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
