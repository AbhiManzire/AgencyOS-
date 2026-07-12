import PDFDocument from 'pdfkit';
import type { FounderReport } from '../reports.types';

function formatCell(value: string | number | null): string {
  if (value === null) {
    return '';
  }
  return String(value);
}

/** Builds a PDF buffer from a founder report (metrics + data rows). */
export async function founderReportToPdf(report: FounderReport): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    doc.fontSize(16).text(`${report.reportType.replace(/_/g, ' ').toUpperCase()} Report`, {
      align: 'left',
    });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#444444');
    doc.text(`Period: ${report.from} to ${report.to}`);
    doc.text(`Currency: ${report.currency}`);
    doc.moveDown(1);

    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text('Metrics');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(9);

    for (const metric of report.metrics) {
      doc.text(`${metric.label}: ${String(metric.value)}`);
    }

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(12).text('Data');
    doc.moveDown(0.5);

    const header = report.columns.map((column) => column.label).join(' | ');
    doc.font('Helvetica-Bold').fontSize(8).text(header, { width: 500 });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(8);
    for (const row of report.rows) {
      if (doc.y > 750) {
        doc.addPage();
      }
      const line = report.columns.map((column) => formatCell(row[column.key] ?? null)).join(' | ');
      doc.text(line, { width: 500 });
      doc.moveDown(0.2);
    }

    doc.end();
  });
}
