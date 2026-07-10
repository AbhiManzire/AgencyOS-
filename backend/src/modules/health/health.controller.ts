import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthCheckResponse, LivenessResponse, ReadinessResponse } from '@agencyos/shared';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Combined health check' })
  check(): Promise<HealthCheckResponse> {
    return this.healthService.check();
  }

  @Public()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe — process is running' })
  live(): LivenessResponse {
    return this.healthService.liveness();
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — dependencies are available' })
  ready(): Promise<ReadinessResponse> {
    return this.healthService.readiness();
  }
}
