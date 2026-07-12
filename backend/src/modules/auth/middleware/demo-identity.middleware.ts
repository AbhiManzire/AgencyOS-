import { Injectable, NestMiddleware } from '@nestjs/common';
import {
  DEPLOY_DEFAULT_TENANT_ID,
  DEPLOY_DEFAULT_USER_ID,
  DEPLOY_DEFAULT_WORKSPACE_ID,
} from '@agencyos/shared';
import { isUUID } from 'class-validator';
import type { NextFunction, Request, Response } from 'express';
import { RBAC_SCOPE_HEADERS } from '../../rbac/rbac.constants';

/**
 * When AUTH_ENABLED=false, ensures demo identity headers are present and valid
 * before controllers/guards run. Controllers such as notifications reject missing
 * or non-RFC UUIDs with 400; production demos often omit or pad these headers.
 */
@Injectable()
export class DemoIdentityMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    this.ensureHeader(
      request,
      RBAC_SCOPE_HEADERS.TENANT,
      process.env.DEMO_TENANT_ID ?? DEPLOY_DEFAULT_TENANT_ID,
    );
    this.ensureHeader(
      request,
      RBAC_SCOPE_HEADERS.WORKSPACE,
      process.env.DEMO_WORKSPACE_ID ?? DEPLOY_DEFAULT_WORKSPACE_ID,
    );
    this.ensureHeader(
      request,
      RBAC_SCOPE_HEADERS.USER,
      process.env.DEMO_USER_ID ?? DEPLOY_DEFAULT_USER_ID,
    );

    next();
  }

  private ensureHeader(request: Request, name: string, fallback: string): void {
    const key = name.toLowerCase();
    const current = this.readRaw(request, key);
    if (isUUID(current)) {
      request.headers[key] = current;
      return;
    }

    const trimmedFallback = fallback.trim();
    request.headers[key] = isUUID(trimmedFallback) ? trimmedFallback : fallback;
  }

  private readRaw(request: Request, key: string): string {
    const value = request.headers[key];
    const raw = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
    return typeof raw === 'string' ? raw.trim() : '';
  }
}
