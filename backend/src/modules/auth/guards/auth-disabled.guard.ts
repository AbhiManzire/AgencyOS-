import { Injectable } from '@nestjs/common';

/**
 * Used when AUTH_ENABLED=false (local/demo only).
 * Allows all routes; identity is taken from trusted local headers.
 * Production must enable JWT auth — see resolveAuthConfigurationFromEnv.
 */
@Injectable()
export class AuthDisabledGuard {
  canActivate(): boolean {
    return true;
  }
}
