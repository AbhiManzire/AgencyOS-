/** Formats a numeric amount as currency. Falls back to USD on invalid codes. */
export function formatMoney(value: number, currency = 'USD', maximumFractionDigits = 2): string {
  const normalized =
    typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency.trim())
      ? currency.trim().toUpperCase()
      : 'USD';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalized,
      maximumFractionDigits,
    }).format(value);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits,
    }).format(value);
  }
}
