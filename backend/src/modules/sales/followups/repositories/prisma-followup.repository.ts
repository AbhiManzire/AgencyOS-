import { Injectable } from '@nestjs/common';
import type { DealFollowUp, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateFollowUpData,
  FollowUpDealScope,
  FollowUpRecord,
  FollowUpRepository,
  FollowUpScope,
  SoftDeleteFollowUpData,
  UpdateFollowUpData,
} from './followup.repository.interface';

type FollowUpWithOwner = DealFollowUp & {
  ownerUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
};

@Injectable()
export class PrismaFollowUpRepository implements FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFollowUpData): Promise<FollowUpRecord> {
    const followUp = await this.prisma.dealFollowUp.create({
      data,
      include: ownerInclude,
    });

    return toFollowUpRecord(followUp);
  }

  async update(
    scope: FollowUpScope,
    id: string,
    data: UpdateFollowUpData,
  ): Promise<FollowUpRecord | null> {
    const result = await this.prisma.dealFollowUp.updateMany({
      where: activeFollowUpWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: FollowUpScope,
    id: string,
    data: SoftDeleteFollowUpData,
  ): Promise<FollowUpRecord | null> {
    const result = await this.prisma.dealFollowUp.updateMany({
      where: activeFollowUpWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const followUp = await this.prisma.dealFollowUp.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
      include: ownerInclude,
    });

    return followUp ? toFollowUpRecord(followUp) : null;
  }

  async findById(scope: FollowUpScope, id: string): Promise<FollowUpRecord | null> {
    const followUp = await this.prisma.dealFollowUp.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: ownerInclude,
    });

    return followUp ? toFollowUpRecord(followUp) : null;
  }

  async listByDeal(scope: FollowUpDealScope): Promise<readonly FollowUpRecord[]> {
    const followUps = await this.prisma.dealFollowUp.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        dealId: scope.dealId,
        deletedAt: null,
      },
      include: ownerInclude,
      orderBy: { scheduledAt: 'asc' },
    });

    return followUps.map(toFollowUpRecord);
  }
}

const ownerInclude = {
  ownerUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

function activeFollowUpWhere(scope: FollowUpScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>,
): string {
  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : user.email;
}

function toFollowUpRecord(followUp: FollowUpWithOwner): FollowUpRecord {
  return {
    id: followUp.id,
    tenantId: followUp.tenantId,
    workspaceId: followUp.workspaceId,
    dealId: followUp.dealId,
    subject: followUp.subject,
    type: followUp.type,
    scheduledAt: followUp.scheduledAt,
    notes: followUp.notes,
    reminderAt: followUp.reminderAt,
    outcome: followUp.outcome,
    nextFollowUpAt: followUp.nextFollowUpAt,
    ownerUserId: followUp.ownerUserId,
    ownerDisplayName: followUp.ownerUser ? resolveUserDisplayName(followUp.ownerUser) : null,
    ownerEmail: followUp.ownerUser?.email ?? null,
    status: followUp.status,
    createdAt: followUp.createdAt,
    updatedAt: followUp.updatedAt,
    createdByUserId: followUp.createdByUserId,
    updatedByUserId: followUp.updatedByUserId,
    deletedAt: followUp.deletedAt,
    deletedByUserId: followUp.deletedByUserId,
  };
}
