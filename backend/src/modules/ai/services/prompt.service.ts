import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AiPromptTemplate } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AiScope, RenderedPrompt } from '../ai.types';

@Injectable()
export class PromptService {
  constructor(private readonly prisma: PrismaService) {}

  renderTemplate(template: string, variables: Readonly<Record<string, string>>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        return variables[key] ?? '';
      }
      return match;
    });
  }

  renderPromptTemplate(
    systemPrompt: string,
    userPromptTemplate: string,
    variables: Readonly<Record<string, string>>,
  ): RenderedPrompt {
    return {
      systemPrompt: this.renderTemplate(systemPrompt, variables),
      userPrompt: this.renderTemplate(userPromptTemplate, variables),
    };
  }

  async getActiveTemplateByKey(scope: AiScope, key: string): Promise<AiPromptTemplate> {
    const template = await this.prisma.aiPromptTemplate.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        key,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
    });

    if (template === null) {
      throw new NotFoundException(`Active prompt template "${key}" not found.`);
    }

    return template;
  }

  async listTemplates(
    scope: AiScope,
    skip: number,
    take: number,
  ): Promise<{ items: readonly AiPromptTemplate[]; total: number }> {
    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      this.prisma.aiPromptTemplate.findMany({
        where,
        orderBy: [{ key: 'asc' }, { version: 'desc' }],
        skip,
        take,
      }),
      this.prisma.aiPromptTemplate.count({ where }),
    ]);

    return { items, total };
  }

  async createTemplate(
    scope: AiScope,
    input: {
      id: string;
      key: string;
      name: string;
      description: string | null;
      systemPrompt: string;
      userPromptTemplate: string;
      isActive: boolean;
      metadata: import('@prisma/client').Prisma.InputJsonValue | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Promise<AiPromptTemplate> {
    const trimmedKey = input.key.trim();
    if (trimmedKey === '') {
      throw new BadRequestException('Prompt template key is required.');
    }

    const latest = await this.prisma.aiPromptTemplate.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        key: trimmedKey,
        deletedAt: null,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = (latest?.version ?? 0) + 1;

    if (input.isActive) {
      await this.prisma.aiPromptTemplate.updateMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          key: trimmedKey,
          deletedAt: null,
        },
        data: { isActive: false, updatedAt: input.updatedAt },
      });
    }

    return this.prisma.aiPromptTemplate.create({
      data: {
        id: input.id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        key: trimmedKey,
        name: input.name.trim(),
        description: input.description,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
        version,
        isActive: input.isActive,
        metadata: input.metadata ?? undefined,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      },
    });
  }
}
