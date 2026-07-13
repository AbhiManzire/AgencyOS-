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
 * Lookup order: keycloak_subject, User.id == sub (UUID bootstrap), then email claim
 * (links invite-created users to Keycloak on first login).
 */
@Injectable()
export class IdentityResolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveByKeycloakSubject(
    subject: string,
    email?: string | null,
  ): Promise<ResolvedAgencyIdentity> {
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
      return this.toActiveIdentity(bySubject);
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
        return this.toActiveIdentity(byId);
      }
    }

    const normalizedEmail = email?.trim().toLowerCase();
    if (normalizedEmail && normalizedEmail.length > 0) {
      const byEmail = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          deletedAt: null,
        },
        select: {
          id: true,
          keycloakSubject: true,
          email: true,
          isActive: true,
        },
      });

      if (byEmail !== null) {
        this.toActiveIdentity(byEmail);

        const linked = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            keycloakSubject: trimmed,
            updatedAt: new Date(),
          },
          select: {
            id: true,
            keycloakSubject: true,
            email: true,
            isActive: true,
          },
        });

        return this.toActiveIdentity(linked);
      }
    }

    throw new UnauthorizedException('Unknown identity');
  }

  private toActiveIdentity(user: {
    readonly id: string;
    readonly keycloakSubject: string;
    readonly email: string;
    readonly isActive: boolean;
  }): ResolvedAgencyIdentity {
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return {
      userId: user.id,
      keycloakSubject: user.keycloakSubject,
      email: user.email,
      isActive: user.isActive,
    };
  }
}
