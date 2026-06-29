import { Injectable } from '@nestjs/common';
import { type Client, type Invoice, type Project, type Quote } from '@prisma/client';
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
      data,
      include: invoiceInclude,
    });

    return toInvoiceRecord(invoice);
  }

  async update(
    scope: InvoiceScope,
    id: string,
    data: UpdateInvoiceData,
  ): Promise<InvoiceRecord | null> {
    const result = await this.prisma.invoice.updateMany({
      where: activeInvoiceWhere(scope, id),
      data,
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
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    createdByUserId: invoice.createdByUserId,
    updatedByUserId: invoice.updatedByUserId,
    deletedAt: invoice.deletedAt,
    deletedByUserId: invoice.deletedByUserId,
  };
}
