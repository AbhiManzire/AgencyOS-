'use client';

import { Archive, Pencil, RotateCcw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer, useToast } from '@/design-system';
import { Body, Caption } from '@/design-system/typography';
import { ArchiveVendorDialog } from '@/features/finance/vendors/components/archive-vendor-dialog';
import { CreateVendorDrawer } from '@/features/finance/vendors/components/create-vendor-drawer';
import { VendorArchivedBadge } from '@/features/finance/vendors/components/vendor-archived-badge';
import { VendorDetailOverview } from '@/features/finance/vendors/components/vendor-detail-overview';
import { VendorNotFoundState } from '@/features/finance/vendors/components/vendor-not-found-state';
import { isVendorArchived } from '@/features/finance/vendors/forms/vendor-form.validation';
import { useArchiveVendor } from '@/features/finance/vendors/hooks/use-archive-vendor';
import { useRestoreVendor } from '@/features/finance/vendors/hooks/use-restore-vendor';
import { useVendor } from '@/features/finance/vendors/hooks/use-vendor';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function VendorDetailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const vendorId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const { data: vendor, isLoading, error, refetch } = useVendor(vendorId);
  const { mutateAsync: archiveVendor, isPending: isArchiving } = useArchiveVendor();
  const { mutateAsync: restoreVendor, isPending: isRestoring } = useRestoreVendor();

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading vendor..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <VendorNotFoundState />;
    }

    return (
      <PageContainer size="lg">
        <ErrorState
          message={extractApiErrorMessage(error)}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!vendor) {
    return <VendorNotFoundState />;
  }

  const archived = isVendorArchived(vendor);

  const handleConfirmArchive = async (): Promise<void> => {
    try {
      await archiveVendor(vendorId);
      showToast('Vendor archived', 'success');
      setArchiveDialogOpen(false);
      router.push('/finance/vendors');
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (): Promise<void> => {
    try {
      await restoreVendor({ id: vendorId });
      showToast('Vendor restored', 'success');
      await refetch();
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  return (
    <PageContainer size="lg">
      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className={
                archived
                  ? 'text-2xl font-semibold tracking-tight text-muted-foreground md:text-3xl'
                  : 'text-2xl font-semibold tracking-tight text-foreground md:text-3xl'
              }
            >
              {vendor.name}
            </h1>
            {archived ? <VendorArchivedBadge /> : null}
          </div>
          {vendor.contactPerson || vendor.email ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
              {vendor.contactPerson ? (
                <div>
                  <Caption className="block uppercase tracking-wide">Contact</Caption>
                  <Body className="text-muted-foreground">{vendor.contactPerson}</Body>
                </div>
              ) : null}
              {vendor.email ? (
                <div>
                  <Caption className="block uppercase tracking-wide">Email</Caption>
                  <Body className="text-muted-foreground">{vendor.email}</Body>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Can permission="finance.vendors.update" mode="disable">
            <Button
              type="button"
              variant="outline"
              disabled={archived}
              className="gap-2"
              onClick={() => {
                setEditDrawerOpen(true);
              }}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          </Can>
          {archived ? (
            <Can permission="finance.vendors.update" mode="disable">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={isRestoring}
                onClick={() => {
                  void handleRestore();
                }}
              >
                <RotateCcw className="size-4" />
                Restore
              </Button>
            </Can>
          ) : (
            <Can permission="finance.vendors.update" mode="disable">
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-danger"
                onClick={() => {
                  setArchiveDialogOpen(true);
                }}
              >
                <Archive className="size-4" />
                Archive
              </Button>
            </Can>
          )}
        </div>
      </div>

      <CreateVendorDrawer
        open={editDrawerOpen}
        mode="edit"
        vendorId={vendorId}
        onOpenChange={setEditDrawerOpen}
      />

      <ArchiveVendorDialog
        open={archiveDialogOpen}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveDialogOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />

      <div className={archived ? 'text-muted-foreground' : undefined}>
        <VendorDetailOverview vendor={vendor} />
      </div>
    </PageContainer>
  );
}
