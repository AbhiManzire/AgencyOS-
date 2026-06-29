import type {
  ContactFormErrors,
  ContactFormValues,
  ContactListItem,
} from '@/features/clients/contacts/types';

export const DEFAULT_CONTACT_FORM_VALUES: ContactFormValues = {
  firstName: '',
  lastName: '',
  jobTitle: '',
  department: '',
  email: '',
  mobile: '',
  phone: '',
  isPrimary: false,
  isDecisionMaker: false,
  status: 'ACTIVE',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates contact form values before submit. */
export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};
  const firstName = values.firstName.trim();

  if (firstName.length === 0) {
    errors.firstName = 'First name is required';
  }

  const email = values.email.trim();
  if (email.length > 0 && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  const mobile = values.mobile.trim();
  if (mobile.length > 50) {
    errors.mobile = 'Mobile must be 50 characters or fewer';
  }

  const phone = values.phone.trim();
  if (phone.length > 50) {
    errors.phone = 'Phone must be 50 characters or fewer';
  }

  return errors;
}

/** Maps a contact list item to form values for edit mode. */
export function contactToFormValues(contact: ContactListItem): ContactFormValues {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    jobTitle: contact.jobTitle,
    department: contact.department,
    email: contact.email,
    mobile: contact.mobile,
    phone: contact.phone,
    isPrimary: contact.isPrimary,
    isDecisionMaker: contact.isDecisionMaker,
    status: contact.status,
  };
}

/** Returns true when form values differ from the loaded baseline. */
export function areContactFormValuesEqual(
  left: ContactFormValues,
  right: ContactFormValues,
): boolean {
  return (
    left.firstName === right.firstName &&
    left.lastName === right.lastName &&
    left.jobTitle === right.jobTitle &&
    left.department === right.department &&
    left.email === right.email &&
    left.mobile === right.mobile &&
    left.phone === right.phone &&
    left.isPrimary === right.isPrimary &&
    left.isDecisionMaker === right.isDecisionMaker &&
    left.status === right.status
  );
}

/** Formats a contact display name. */
export function formatContactName(
  contact: Pick<ContactListItem, 'firstName' | 'lastName'>,
): string {
  return [contact.firstName, contact.lastName].filter((part) => part.trim().length > 0).join(' ');
}
