import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import type { AcceptInvitationResult } from '../settings.types';
import { SettingsService } from '../services/settings.service';

/** Public invitation acceptance — no JWT / RBAC required. */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Post('accept')
  async accept(
    @Body() body: AcceptInvitationDto,
  ): Promise<ApiSuccessResponse<AcceptInvitationResult>> {
    const result = await this.settingsService.acceptInvitation(body);
    return successResponse(result);
  }
}
