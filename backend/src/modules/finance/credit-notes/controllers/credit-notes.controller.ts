import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import {
  ApplyCreditNoteDto,
  CreateCreditNoteDto,
  ListCreditNotesQueryDto,
} from '../dto/create-credit-note.dto';
import { CreditNoteMapper } from '../mappers/credit-note.mapper';
import type {
  CreditNoteApplicationRecord,
  CreditNoteRecord,
} from '../repositories/credit-note.repository.interface';
import type {
  CreditNoteApplicationContext,
  CreditNoteScope,
} from '../services/credit-note-application.types';
import { CreditNoteService } from '../services/credit-note.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('credit-notes')
export class CreditNotesController {
  constructor(private readonly creditNoteService: CreditNoteService) {}

  @Post()
  @RequirePermissions('finance.credit_notes.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateCreditNoteDto,
  ): Promise<ApiSuccessResponse<CreditNoteRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const note = await this.creditNoteService.createCreditNote(
      scope,
      CreditNoteMapper.toCreateCommand(dto),
      context,
    );
    return successResponse(note);
  }

  @Get()
  @RequirePermissions('finance.credit_notes.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListCreditNotesQueryDto,
  ): Promise<ApiSuccessResponse<readonly CreditNoteRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = CreditNoteMapper.toListQuery(queryDto);
    const result = await this.creditNoteService.listCreditNotes(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('finance.credit_notes.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<CreditNoteRecord>> {
    const scope = this.resolveScope(headers);
    const note = await this.creditNoteService.getCreditNote(scope, id);
    return successResponse(note);
  }

  @Post(':id/apply')
  @RequirePermissions('finance.credit_notes.update')
  async apply(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyCreditNoteDto,
  ): Promise<
    ApiSuccessResponse<{ note: CreditNoteRecord; application: CreditNoteApplicationRecord }>
  > {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.creditNoteService.applyCreditNote(
      scope,
      id,
      CreditNoteMapper.toApplyCommand(dto),
      context,
    );
    return successResponse(result);
  }

  @Post(':id/void')
  @RequirePermissions('finance.credit_notes.update')
  async voidNote(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<CreditNoteRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const note = await this.creditNoteService.voidCreditNote(scope, id, context);
    return successResponse(note);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): CreditNoteScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): CreditNoteApplicationContext {
    return { actorUserId: this.readHeader(headers, USER_HEADER) };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
