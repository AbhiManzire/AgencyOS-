import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { Public } from '../../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { UpdateProposalDto } from '../dto/update-proposal.dto';
import { ProposalMapper } from '../mappers/proposal.mapper';
import type { ProposalRecord } from '../repositories/proposal.repository.interface';
import type {
  ProposalApplicationContext,
  ProposalScope,
} from '../services/proposal-application.types';
import { ProposalService } from '../services/proposal.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post()
  @RequirePermissions('proposals.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateProposalDto,
  ): Promise<ApiSuccessResponse<ProposalRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProposalMapper.toCreateProposalCommand(dto);
    const proposal = await this.proposalService.createProposal(scope, command, context);

    return successResponse(proposal);
  }

  @Get(':id')
  @RequirePermissions('proposals.read')
  async getOne(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProposalRecord>> {
    const scope = this.resolveScope(headers);
    const proposal = await this.proposalService.getProposal(scope, id);

    return successResponse(proposal);
  }

  @Patch(':id')
  @RequirePermissions('proposals.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProposalDto,
  ): Promise<ApiSuccessResponse<ProposalRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProposalMapper.toUpdateProposalCommand(dto);
    const proposal = await this.proposalService.updateProposal(scope, id, command, context);

    return successResponse(proposal);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ProposalScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ProposalApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
