'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ContactPrimaryIndicator } from '@/features/clients/contacts/components/contact-primary-indicator';
import { ContactRowActions } from '@/features/clients/contacts/components/contact-row-actions';
import { ContactStatusBadge } from '@/features/clients/contacts/components/contact-status-badge';
import { formatContactName } from '@/features/clients/contacts/forms/contact-form.validation';
import type { ContactListItem } from '@/features/clients/contacts/types';
import { displayClientField } from '@/features/clients/utils/client-display';

interface ClientContactsTableProps {
  readonly contacts: readonly ContactListItem[];
  readonly readOnly?: boolean;
  readonly onEditContact: (contactId: string) => void;
  readonly onDeleteContact: (contactId: string) => void;
}

export function ClientContactsTable({
  contacts,
  readOnly = false,
  onEditContact,
  onDeleteContact,
}: ClientContactsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Designation</TableHead>
              <TableHead className="hidden lg:table-cell">Role</TableHead>
              <TableHead className="hidden lg:table-cell">Department</TableHead>
              <TableHead className="hidden xl:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Mobile</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => {
              const name = formatContactName(contact);

              return (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground md:hidden">
                        {displayClientField(contact.jobTitle || null)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[180px] truncate md:table-cell">
                    {displayClientField(contact.jobTitle || null)}
                  </TableCell>
                  <TableCell className="hidden max-w-[140px] truncate lg:table-cell">
                    {displayClientField(contact.role || null)}
                  </TableCell>
                  <TableCell className="hidden max-w-[160px] truncate lg:table-cell">
                    {displayClientField(contact.department || null)}
                  </TableCell>
                  <TableCell className="hidden max-w-[220px] truncate xl:table-cell">
                    {displayClientField(contact.email || null)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {displayClientField(contact.mobile || null)}
                  </TableCell>
                  <TableCell>
                    <ContactPrimaryIndicator isPrimary={contact.isPrimary} />
                  </TableCell>
                  <TableCell>
                    <ContactStatusBadge status={contact.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ContactRowActions
                      contactName={name}
                      disabled={readOnly}
                      onEdit={() => {
                        onEditContact(contact.id);
                      }}
                      onDelete={() => {
                        onDeleteContact(contact.id);
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
