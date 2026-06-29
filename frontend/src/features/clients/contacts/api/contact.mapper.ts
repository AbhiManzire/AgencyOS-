import type { ContactRecord } from '@/features/clients/contacts/api/contact.types';
import type { ContactListItem } from '@/features/clients/contacts/types';

/** Maps an API contact record to a contacts table row. */
export function contactRecordToListItem(record: ContactRecord): ContactListItem {
  return {
    id: record.id,
    clientId: record.clientId,
    firstName: record.firstName,
    lastName: record.lastName ?? '',
    jobTitle: record.jobTitle ?? '',
    department: record.department ?? '',
    email: record.email ?? '',
    mobile: record.mobile ?? '',
    phone: record.phone ?? '',
    isPrimary: record.isPrimary,
    isDecisionMaker: record.isDecisionMaker,
    status: record.status,
  };
}
