'use client';

import { Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { ClientContactsTable } from '@/features/clients/contacts/components/client-contacts-table';
import { ContactFormDrawer } from '@/features/clients/contacts/components/contact-form-drawer';
import { DeleteContactDialog } from '@/features/clients/contacts/components/delete-contact-dialog';
import {
  formatContactName,
  toCreateContactPayload,
  toUpdateContactPayload,
} from '@/features/clients/contacts/forms/contact-form.validation';
import { useClientContacts } from '@/features/clients/contacts/hooks/use-client-contacts';
import { useCreateClientContact } from '@/features/clients/contacts/hooks/use-create-client-contact';
import { useDeleteClientContact } from '@/features/clients/contacts/hooks/use-delete-client-contact';
import { useUpdateClientContact } from '@/features/clients/contacts/hooks/use-update-client-contact';
import type { ContactFormValues } from '@/features/clients/contacts/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface ClientContactsTabProps {
  readonly clientId: string;
  readonly readOnly?: boolean;
}

export function ClientContactsTab({ clientId, readOnly = false }: ClientContactsTabProps) {
  const { showToast } = useToast();
  const { data: contacts = [], isLoading, error, refetch } = useClientContacts(clientId);
  const { mutateAsync: createContact, isPending: isCreating } = useCreateClientContact(clientId);
  const { mutateAsync: updateContact, isPending: isUpdating } = useUpdateClientContact(clientId);
  const { mutateAsync: deleteContact, isPending: isDeleting } = useDeleteClientContact(clientId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === activeContactId),
    [activeContactId, contacts],
  );

  const deleteContactName = useMemo(() => {
    const contact = contacts.find((item) => item.id === deleteContactId);
    return contact ? formatContactName(contact) : 'this contact';
  }, [contacts, deleteContactId]);

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveContactId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (contactId: string): void => {
    setDrawerMode('edit');
    setActiveContactId(contactId);
    setDrawerOpen(true);
  };

  const handleSave = async (values: ContactFormValues): Promise<void> => {
    if (drawerMode === 'edit' && activeContactId !== null) {
      await updateContact({
        contactId: activeContactId,
        payload: toUpdateContactPayload(values),
      });
      return;
    }

    await createContact(toCreateContactPayload(values));
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteContactId === null) {
      return;
    }

    try {
      await deleteContact(deleteContactId);
      showToast('Contact removed successfully');
      setDeleteContactId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading contacts..." />;
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Contacts</h2>
          <p className="text-sm text-muted-foreground">People associated with this client.</p>
        </div>
        {!readOnly ? (
          <Button type="button" className="gap-2" onClick={openCreateDrawer}>
            <Plus className="size-4" />
            Add Contact
          </Button>
        ) : null}
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add the first point of contact for this client."
          action={
            readOnly ? undefined : (
              <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                <Plus className="size-4" />
                Add Contact
              </Button>
            )
          }
        />
      ) : (
        <ClientContactsTable
          contacts={contacts}
          readOnly={readOnly}
          onEditContact={openEditDrawer}
          onDeleteContact={setDeleteContactId}
        />
      )}

      <ContactFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        contact={activeContact}
        isPending={isCreating || isUpdating}
        onOpenChange={setDrawerOpen}
        onSave={handleSave}
      />

      <DeleteContactDialog
        open={deleteContactId !== null}
        contactName={deleteContactName}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteContactId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
