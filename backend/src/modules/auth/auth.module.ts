import {
  MiddlewareConsumer,
  Module,
  NestModule,
  type Provider,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthBootstrapService } from './auth-bootstrap.service';
import { AUTH_CONFIGURATION, resolveAuthConfigurationFromEnv } from './auth.configuration';
import { AuthController } from './auth.controller';
import { AuthDisabledGuard } from './guards/auth-disabled.guard';
import { BindJwtIdentityGuard } from './guards/bind-jwt-identity.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DemoIdentityMiddleware } from './middleware/demo-identity.middleware';
import { IdentityResolutionService } from './services/identity-resolution.service';
import { JwtStrategy } from './strategies/jwt.strategy';

const authConfiguration = resolveAuthConfigurationFromEnv();

const authProviders: Provider[] = [
  {
    provide: AUTH_CONFIGURATION,
    useValue: authConfiguration,
  },
  AuthBootstrapService,
  IdentityResolutionService,
  DemoIdentityMiddleware,
  {
    provide: APP_GUARD,
    useFactory: (reflector: Reflector) =>
      authConfiguration.enabled ? new JwtAuthGuard(reflector) : new AuthDisabledGuard(),
    inject: [Reflector],
  },
];

if (authConfiguration.enabled) {
  authProviders.push(JwtStrategy);
  authProviders.push({
    provide: APP_GUARD,
    useClass: BindJwtIdentityGuard,
  });
}

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: authProviders,
  exports: [PassportModule, IdentityResolutionService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Demo mode only: inject identity headers before controllers validate them.
    if (!authConfiguration.enabled) {
      consumer.apply(DemoIdentityMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    }
  }
}
