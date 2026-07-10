import { Inject, Injectable, Logger } from '@nestjs/common';
import { AUTH_CONFIGURATION, type AuthConfiguration } from './auth.configuration';

@Injectable()
export class AuthBootstrapService {
  private readonly logger = new Logger(AuthBootstrapService.name);

  constructor(
    @Inject(AUTH_CONFIGURATION)
    authConfiguration: AuthConfiguration,
  ) {
    if (!authConfiguration.enabled) {
      this.logger.warn(
        'Authentication is disabled — local/demo only. Production requires AUTH_ENABLED=true.',
      );
    }
  }
}
