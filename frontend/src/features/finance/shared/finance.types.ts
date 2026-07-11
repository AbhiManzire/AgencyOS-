export type InvoiceStatus =
  'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID';

export type TaxMode = 'TAX_EXCLUSIVE' | 'TAX_INCLUSIVE';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';

export type PaymentStatus = 'COMPLETED' | 'VOIDED';

export type PaymentMethod =
  'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'CHECK' | 'ONLINE' | 'OTHER';

export type PurchaseBillStatus =
  'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type CreditNoteStatus = 'DRAFT' | 'ISSUED' | 'APPLIED' | 'VOID';

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type LedgerAccountType = 'RECEIVABLE' | 'PAYABLE' | 'PAYMENT' | 'CLIENT' | 'VENDOR';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  VOID: 'Void',
};

export const TAX_MODE_LABELS: Record<TaxMode, string> = {
  TAX_EXCLUSIVE: 'Tax exclusive',
  TAX_INCLUSIVE: 'Tax inclusive',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_REQUIRED: 'Not required',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank transfer',
  UPI: 'UPI',
  CARD: 'Card',
  CHEQUE: 'Cheque',
  CHECK: 'Check',
  ONLINE: 'Online',
  OTHER: 'Other',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: 'Completed',
  VOIDED: 'Voided',
};

export const PURCHASE_BILL_STATUS_LABELS: Record<PurchaseBillStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  APPLIED: 'Applied',
  VOID: 'Void',
};

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export const LEDGER_ACCOUNT_TYPE_LABELS: Record<LedgerAccountType, string> = {
  RECEIVABLE: 'Receivable',
  PAYABLE: 'Payable',
  PAYMENT: 'Payment',
  CLIENT: 'Client',
  VENDOR: 'Vendor',
};
