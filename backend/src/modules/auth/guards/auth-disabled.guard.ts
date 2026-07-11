import { Injectable } from '@nestjs/common';

/**
 * Used when AUTH_ENABLED=false (local/demo, including temporary production demos).
 * Allows all routes; identity is taken from trusted local headers.
 * JWT auth remains intact and is used when AUTH_ENABLED=true.
 */
@Injectable()
export class AuthDisabledGuard {
  canActivate(): boolean {
    return true;
  }
}
