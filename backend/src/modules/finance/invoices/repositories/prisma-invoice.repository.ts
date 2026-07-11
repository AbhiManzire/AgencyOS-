import { Injectable } from '@nestjs/common';
import { Prisma, type Client, type Invoice, type Project, type Quote } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateInvoiceData,
  FindInvoiceByIdOptions,
  InvoiceRecord,
  InvoiceRepository,
  InvoiceScope,
  ListInvoicesParams,
  ListInvoicesResult,
  UpdateInvoiceData,
} from './invoice.repository.interface';

type InvoiceWithRelations = Invoice & {
  client: Pick<Client, 'displayName'>;
  project: Pick<Project, 'name'>;
  quote: Pick<Quote, 'quoteNumber'> | null;
};

@Injectable()
export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInvoiceData): Promise<InvoiceRecord> {
    const invoice = await this.prisma.invoice.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        clientId: data.clientId,
        projectId: data.projectId,
        quoteId: data.quoteId ?? null,
        dealId: data.dealId ?? null,
        invoiceNumber: data.invoiceNumber,
        status: data.status ?? 'DRAFT',
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        currency: data.currency ?? 'USD',
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        discountAmount: new Prisma.Decimal(data.discountAmount ?? 0),
        taxAmount: new Prisma.Decimal(data.taxAmount ?? 0),
        subtotal: new Prisma.Decimal(data.subtotal ?? 0),
        grandTotal: new Prisma.Decimal(data.grandTotal ?? 0),
        balanceDue: new Prisma.Decimal(data.balanceDue ?? 0),
        taxMode: data.taxMode ?? 'TAX_EXCLUSIVE',
        viewedAt: data.viewedAt ?? null,
        approvalStatus: data.approvalStatus ?? 'NOT_REQUIRED',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
      include: invoiceInclude,
    });

    return toInvoiceRecord(invoice);
  }

  async update(
    scope: InvoiceScope,
    id: string,
    data: UpdateInvoiceData,
  ): Promise<InvoiceRecord | null> {
    const { discountAmount, taxAmount, subtotal, grandTotal, balanceDue, ...rest } = data;

    const result = await this.prisma.invoice.updateMany({
      where: activeInvoiceWhere(scope, id),
      data: {
        ...rest,
        ...(discountAmount !== undefined
          ? { discountAmount: new Prisma.Decimal(discountAmount) }
          : {}),
        ...(taxAmount !== undefined ? { taxAmount: new Prisma.Decimal(taxAmount) } : {}),
        ...(subtotal !== undefined ? { subtotal: new Prisma.Decimal(subtotal) } : {}),
        ...(grandTotal !== undefined ? { grandTotal: new Prisma.Decimal(grandTotal) } : {}),
        ...(balanceDue !== undefined ? { balanceDue: new Prisma.Decimal(balanceDue) } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(
    scope: InvoiceScope,
    id: string,
    options?: FindInvoiceByIdOptions,
  ): Promise<InvoiceRecord | null> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
      include: invoiceInclude,
    });

    return invoice ? toInvoiceRecord(invoice) : null;
  }

  async findByInvoiceNumber(
    scope: InvoiceScope,
    invoiceNumber: string,
  ): Promise<InvoiceRecord | null> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: invoiceInclude,
    });

    return invoice ? toInvoiceRecord(invoice) : null;
  }

  async list(params: ListInvoicesParams): Promise<ListInvoicesResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      status,
      clientId,
      projectId,
      quoteId,
      includeArchived = false,
    } = params;

    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(projectId !== undefined ? { projectId } : {}),
      ...(quoteId !== undefined ? { quoteId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        include: invoiceInclude,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items: items.map(toInvoiceRecord),
      total,
    };
  }
}

const invoiceInclude = {
  client: { select: { displayName: true } },
  project: { select: { name: true } },
  quote: { select: { quoteNumber: true } },
} as const;

function activeInvoiceWhere(scope: InvoiceScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return value.toNumber();
}

function toInvoiceRecord(invoice: InvoiceWithRelations): InvoiceRecord {
  return {
    id: invoice.id,
    tenantId: invoice.tenantId,
    workspaceId: invoice.workspaceId,
    clientId: invoice.clientId,
    clientName: invoice.client.displayName,
    projectId: invoice.projectId,
    projectName: invoice.project.name,
    quoteId: invoice.quoteId,
    quoteNumber: invoice.quote?.quoteNumber ?? null,
    dealId: invoice.dealId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    notes: invoice.notes,
    terms: invoice.terms,
    discountAmount: decimalToNumber(invoice.discountAmount),
    taxAmount: decimalToNumber(invoice.taxAmount),
    subtotal: decimalToNumber(invoice.subtotal),
    grandTotal: decimalToNumber(invoice.grandTotal),
    balanceDue: decimalToNumber(invoice.balanceDue),
    taxMode: invoice.taxMode,
    viewedAt: invoice.viewedAt,
    approvalStatus: invoice.approvalStatus,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    createdByUserId: invoice.createdByUserId,
    updatedByUserId: invoice.updatedByUserId,
    deletedAt: invoice.deletedAt,
    deletedByUserId: invoice.deletedByUserId,
  };
}
