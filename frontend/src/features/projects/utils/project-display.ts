/** Returns a display string for optional project field values. */
export function displayProjectField(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return value;
}

/** Formats an ISO date string for display. */
export function formatProjectDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

/** Formats billable flag for display. */
export function formatProjectBillable(isBillable: boolean): string {
  return isBillable ? 'Yes' : 'No';
}
