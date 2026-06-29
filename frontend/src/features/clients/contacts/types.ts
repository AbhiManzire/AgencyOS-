export type ContactStatus = 'ACTIVE' | 'INACTIVE';

export interface ContactListItem {
  readonly id: string;
  readonly clientId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly jobTitle: string;
  readonly department: string;
  readonly email: string;
  readonly mobile: string;
  readonly phone: string;
  readonly isPrimary: boolean;
  readonly isDecisionMaker: boolean;
  readonly status: ContactStatus;
}

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  email: string;
  mobile: string;
  phone: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  status: ContactStatus;
}

export interface ContactFormErrors {
  firstName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  form?: string;
}
