import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RbacController } from './controllers/rbac.controller';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionContextMiddleware } from './middleware/permission-context.middleware';
import { RBAC_CONFIGURATION, resolveRbacConfigurationFromEnv } from './rbac.configuration';
import { RbacBootstrapService } from './rbac-bootstrap.service';
import { RBAC_REPOSITORY } from './repositories/rbac.repository.interface';
import { PrismaRbacRepository } from './repositories/prisma-rbac.repository';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';

const rbacConfiguration = resolveRbacConfigurationFromEnv();

@Module({
  providers: [
    {
      provide: RBAC_CONFIGURATION,
      useValue: rbacConfiguration,
    },
    {
      provide: RBAC_REPOSITORY,
      useClass: PrismaRbacRepository,
    },
    PermissionService,
    RoleService,
    RbacBootstrapService,
    PermissionContextMiddleware,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  controllers: [RbacController],
  exports: [
    RBAC_REPOSITORY,
    PermissionService,
    RoleService,
    RBAC_CONFIGURATION,
    RbacBootstrapService,
  ],
})
export class RbacModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(PermissionContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
