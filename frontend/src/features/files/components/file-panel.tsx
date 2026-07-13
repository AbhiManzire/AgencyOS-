'use client';

import { FolderOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { DeleteFileDialog } from '@/features/files/components/delete-file-dialog';
import { FileCard } from '@/features/files/components/file-card';
import { FileUploader } from '@/features/files/components/file-uploader';
import type { FileDocumentFolder } from '@/features/files/api/file.types';
import { useDeleteFile } from '@/features/files/hooks/use-delete-file';
import { useFiles } from '@/features/files/hooks/use-files';
import { useUploadFile } from '@/features/files/hooks/use-upload-file';
import { Can } from '@/lib/rbac';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface FilePanelProps {
  readonly entityType: string;
  readonly entityId: string;
  /** Folder applied to new uploads when set. */
  readonly folder?: FileDocumentFolder;
  /** Client-side filter by folder. */
  readonly filterFolder?: FileDocumentFolder;
}

export function FilePanel({ entityType, entityId, folder, filterFolder }: FilePanelProps) {
  const { showToast } = useToast();
  const entityParams = { entityType, entityId };

  const { data: files = [], isLoading, error, refetch } = useFiles(entityParams);
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile(entityParams);
  const { mutateAsync: deleteFile, isPending: isDeleting } = useDeleteFile(entityParams);

  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);

  const visibleFiles = useMemo(() => {
    if (filterFolder === undefined) {
      return files;
    }
    return files.filter((file) => file.folder === filterFolder);
  }, [files, filterFolder]);

  const deleteFileName = useMemo(() => {
    const file = files.find((item) => item.id === deleteFileId);
    return file?.originalName ?? 'this file';
  }, [deleteFileId, files]);

  const handleUpload = async (file: File): Promise<void> => {
    if (folder !== undefined) {
      await uploadFile({ file, folder });
    } else {
      await uploadFile(file);
    }
    showToast('File uploaded successfully');
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteFileId === null) {
      return;
    }

    try {
      await deleteFile(deleteFileId);
      showToast('File deleted successfully');
      setDeleteFileId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading files..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Files</h2>
        <p className="text-sm text-muted-foreground">Attachments linked to this record.</p>
      </div>

      <Can permission="files.manage">
        <FileUploader isPending={isUploading} onUpload={handleUpload} />
      </Can>

      {visibleFiles.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No files yet"
          description="Upload the first file to attach it to this record."
        />
      ) : (
        <div className="space-y-3">
          {visibleFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => {
                setDeleteFileId(file.id);
              }}
            />
          ))}
        </div>
      )}

      <DeleteFileDialog
        open={deleteFileId !== null}
        fileName={deleteFileName}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteFileId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
