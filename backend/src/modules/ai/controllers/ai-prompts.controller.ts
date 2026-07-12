import { BadRequestException, Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { AiPromptTemplateRecord, AiScope } from '../ai.types';
import { CreateAiPromptTemplateDto, ListAiPromptsQueryDto } from '../dto/ai-prompt.dto';
import { AiAuditService } from '../services/ai-audit.service';
import { PromptService } from '../services/prompt.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('ai/prompts')
export class AiPromptsController {
  constructor(
    private readonly promptService: PromptService,
    private readonly aiAudit: AiAuditService,
  ) {}

  @Get()
  @RequirePermissions('ai.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ListAiPromptsQueryDto,
  ): Promise<ApiSuccessResponse<readonly AiPromptTemplateRecord[]>> {
    const scope = this.resolveScope(headers);
    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 25, 100);
    const result = await this.promptService.listTemplates(scope, skip, take);
    return successResponse(
      result.items.map((row) => this.toRecord(row)),
      {
        total: result.total,
        skip,
        take,
      },
    );
  }

  @Post()
  @RequirePermissions('ai.manage')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateAiPromptTemplateDto,
  ): Promise<ApiSuccessResponse<AiPromptTemplateRecord>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveOptionalUserId(headers);
    const now = new Date();
    const row = await this.promptService.createTemplate(scope, {
      id: randomUUID(),
      key: dto.key,
      name: dto.name,
      description: dto.description ?? null,
      systemPrompt: dto.systemPrompt,
      userPromptTemplate: dto.userPromptTemplate,
      isActive: dto.isActive ?? true,
      metadata: dto.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await this.aiAudit.write(scope, {
      actorUserId,
      entityType: 'AiPromptTemplate',
      entityId: row.id,
      summary: `Created prompt template "${row.key}" v${String(row.version)}.`,
      metadata: { key: row.key, version: row.version },
    });

    return successResponse(this.toRecord(row));
  }

  private toRecord(row: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    systemPrompt: string;
    userPromptTemplate: string;
    version: number;
    isActive: boolean;
    metadata: import('@prisma/client').Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): AiPromptTemplateRecord {
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      description: row.description,
      systemPrompt: row.systemPrompt,
      userPromptTemplate: row.userPromptTemplate,
      version: row.version,
      isActive: row.isActive,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): AiScope {
    const tenantId = this.readHeader(headers, TENANT_HEADER);
    const workspaceId = this.readHeader(headers, WORKSPACE_HEADER);

    if (!isUUID(tenantId)) {
      throw new BadRequestException(`Header "${TENANT_HEADER}" must be a valid UUID.`);
    }
    if (!isUUID(workspaceId)) {
      throw new BadRequestException(`Header "${WORKSPACE_HEADER}" must be a valid UUID.`);
    }

    return { tenantId, workspaceId };
  }

  private resolveOptionalUserId(
    headers: Record<string, string | string[] | undefined>,
  ): string | null {
    const userId = this.readHeader(headers, USER_HEADER);
    if (userId === '') {
      return null;
    }
    if (!isUUID(userId)) {
      throw new BadRequestException(`Header "${USER_HEADER}" must be a valid UUID.`);
    }
    return userId;
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
