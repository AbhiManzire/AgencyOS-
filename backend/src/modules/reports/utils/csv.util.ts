import type { FounderReport } from '../reports.types';

/** Escapes a CSV cell value per RFC 4180. */
function escapeCsvCell(value: string | number | null): string {
  if (value === null) {
    return '';
  }

  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/** Builds a CSV document from a founder report (metrics + data rows). */
export function founderReportToCsv(report: FounderReport): string {
  const lines: string[] = [];

  lines.push(['Metric', 'Value'].map(escapeCsvCell).join(','));
  for (const metric of report.metrics) {
    lines.push([metric.label, metric.value].map(escapeCsvCell).join(','));
  }

  lines.push('');
  lines.push(report.columns.map((column) => escapeCsvCell(column.label)).join(','));

  for (const row of report.rows) {
    lines.push(report.columns.map((column) => escapeCsvCell(row[column.key] ?? null)).join(','));
  }

  return `${lines.join('\r\n')}\r\n`;
}
