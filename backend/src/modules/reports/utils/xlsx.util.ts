import ExcelJS from 'exceljs';
import type { FounderReport } from '../reports.types';

/** Builds an XLSX workbook buffer (Metrics + Data sheets) from a founder report. */
export async function founderReportToXlsx(report: FounderReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AgencyOS';
  workbook.created = new Date();

  const metricsSheet = workbook.addWorksheet('Metrics');
  metricsSheet.columns = [
    { header: 'Key', key: 'key', width: 24 },
    { header: 'Metric', key: 'label', width: 32 },
    { header: 'Value', key: 'value', width: 16 },
    { header: 'Format', key: 'format', width: 12 },
  ];

  for (const metric of report.metrics) {
    metricsSheet.addRow({
      key: metric.key,
      label: metric.label,
      value: metric.value,
      format: metric.format,
    });
  }

  const dataSheet = workbook.addWorksheet('Data');
  dataSheet.columns = report.columns.map((column) => ({
    header: column.label,
    key: column.key,
    width: 18,
  }));

  for (const row of report.rows) {
    const record: Record<string, string | number | null> = {};
    for (const column of report.columns) {
      record[column.key] = row[column.key] ?? null;
    }
    dataSheet.addRow(record);
  }

  const metaSheet = workbook.addWorksheet('Meta');
  metaSheet.addRow(['Report Type', report.reportType]);
  metaSheet.addRow(['From', report.from]);
  metaSheet.addRow(['To', report.to]);
  metaSheet.addRow(['Currency', report.currency]);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
