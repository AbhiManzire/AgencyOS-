import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

export interface ResolvedAgencyIdentity {
  readonly userId: string;
  readonly keycloakSubject: string;
  readonly email: string;
  readonly isActive: boolean;
}

/**
 * Maps Keycloak JWT `sub` to AgencyOS `User.id` for RBAC and tenant scoping.
 * Lookup order: keycloak_subject match, then User.id == sub (UUID bootstrap).
 */
@Injectable()
export class IdentityResolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveByKeycloakSubject(subject: string): Promise<ResolvedAgencyIdentity> {
    const trimmed = subject.trim();
    if (trimmed.length === 0) {
      throw new UnauthorizedException('Invalid token subject');
    }

    const bySubject = await this.prisma.user.findFirst({
      where: {
        keycloakSubject: trimmed,
        deletedAt: null,
      },
      select: {
        id: true,
        keycloakSubject: true,
        email: true,
        isActive: true,
      },
    });

    if (bySubject !== null) {
      if (!bySubject.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      return {
        userId: bySubject.id,
        keycloakSubject: bySubject.keycloakSubject,
        email: bySubject.email,
        isActive: bySubject.isActive,
      };
    }

    if (isUUID(trimmed)) {
      const byId = await this.prisma.user.findFirst({
        where: {
          id: trimmed,
          deletedAt: null,
        },
        select: {
          id: true,
          keycloakSubject: true,
          email: true,
          isActive: true,
        },
      });

      if (byId !== null) {
        if (!byId.isActive) {
          throw new UnauthorizedException('User account is inactive');
        }

        return {
          userId: byId.id,
          keycloakSubject: byId.keycloakSubject,
          email: byId.email,
          isActive: byId.isActive,
        };
      }
    }

    throw new UnauthorizedException('Unknown identity');
  }
}
