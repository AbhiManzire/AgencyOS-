import PDFDocument from 'pdfkit';
import { calculateQuotePricingSummary } from '../../../sales/pricing/pricing-engine';
import type { InvoiceLineItemRecord } from '../../invoice-line-items/repositories/invoice-line-item.repository.interface';
import type { InvoiceRecord } from '../repositories/invoice.repository.interface';

export interface InvoicePdfInput {
  readonly invoice: InvoiceRecord;
  readonly lineItems: readonly InvoiceLineItemRecord[];
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(value);
}

export class InvoicePdfGenerator {
  async generate(input: InvoicePdfInput): Promise<Buffer> {
    const { invoice, lineItems } = input;
    const summary = calculateQuotePricingSummary(lineItems);

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

      doc.fontSize(22).text('INVOICE', { align: 'right' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#444444');
      doc.text(invoice.invoiceNumber, { align: 'right' });
      doc.moveDown(2);

      doc.fillColor('#000000').fontSize(10);
      doc.text(`Bill To: ${invoice.clientName}`);
      doc.text(`Project: ${invoice.projectName}`);
      doc.moveDown();

      doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`);
      doc.text(`Due Date: ${formatDate(invoice.dueDate)}`);
      doc.text(`Status: ${invoice.status}`);
      doc.moveDown(2);

      const tableTop = doc.y;
      const columns = {
        name: 50,
        qty: 260,
        unit: 310,
        price: 370,
        total: 470,
      };

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Item', columns.name, tableTop);
      doc.text('Qty', columns.qty, tableTop);
      doc.text('Unit', columns.unit, tableTop);
      doc.text('Price', columns.price, tableTop);
      doc.text('Total', columns.total, tableTop);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(9);

      for (const item of lineItems) {
        const rowY = doc.y;

        if (rowY > 700) {
          doc.addPage();
        }

        doc.text(item.name, columns.name, doc.y, { width: 200 });
        const nameHeight = doc.heightOfString(item.name, { width: 200 });
        doc.text(String(item.quantity), columns.qty, rowY);
        doc.text(item.unit ?? '—', columns.unit, rowY);
        doc.text(formatMoney(item.unitPrice, invoice.currency), columns.price, rowY);
        doc.text(formatMoney(item.total, invoice.currency), columns.total, rowY);

        if (item.description) {
          doc
            .fillColor('#666666')
            .fontSize(8)
            .text(item.description, columns.name, rowY + nameHeight, {
              width: 200,
            });
          doc.fillColor('#000000').fontSize(9);
        }

        doc.y = Math.max(doc.y, rowY + nameHeight + (item.description ? 14 : 0));
        doc.moveDown(0.75);
      }

      doc.moveDown(1.5);
      const summaryX = 370;
      doc.font('Helvetica').fontSize(10);
      doc.text(`Subtotal: ${formatMoney(summary.subtotal, invoice.currency)}`, summaryX, doc.y, {
        align: 'right',
        width: 175,
      });
      doc.moveDown(0.5);
      doc.text(
        `Discount: -${formatMoney(summary.discountTotal, invoice.currency)}`,
        summaryX,
        doc.y,
        {
          align: 'right',
          width: 175,
        },
      );
      doc.moveDown(0.5);
      doc.text(`Tax: ${formatMoney(summary.taxTotal, invoice.currency)}`, summaryX, doc.y, {
        align: 'right',
        width: 175,
      });
      doc.moveDown(0.75);
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(
        `Grand Total: ${formatMoney(summary.grandTotal, invoice.currency)}`,
        summaryX,
        doc.y,
        {
          align: 'right',
          width: 175,
        },
      );

      if (invoice.notes) {
        doc.moveDown(2);
        doc.font('Helvetica-Bold').fontSize(10).text('Notes');
        doc.font('Helvetica').fontSize(9).text(invoice.notes, { width: 495 });
      }

      doc.end();
    });
  }
}
