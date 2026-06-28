/** Returns a display string for optional client field values. */
export function displayClientField(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim().length === 0) {
    return '—';
  }

  return value;
}

/** Formats client address fields into a multi-line display string. */
export function formatClientAddress(client: {
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly stateRegion: string | null;
  readonly postalCode: string | null;
  readonly countryCode: string | null;
}): string {
  const locality = [client.city, client.stateRegion, client.postalCode]
    .filter((part) => part !== null && part.trim().length > 0)
    .join(', ');

  const lines = [client.addressLine1, client.addressLine2, locality, client.countryCode].filter(
    (part): part is string => part !== null && part.trim().length > 0,
  );

  return lines.length > 0 ? lines.join('\n') : '—';
}
