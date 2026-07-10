import { Module, type Provider } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AuthBootstrapService } from './auth-bootstrap.service';
import { AUTH_CONFIGURATION, resolveAuthConfigurationFromEnv } from './auth.configuration';
import { AuthController } from './auth.controller';
import { AuthDisabledGuard } from './guards/auth-disabled.guard';
import { BindJwtIdentityGuard } from './guards/bind-jwt-identity.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

const authConfiguration = resolveAuthConfigurationFromEnv();

const authProviders: Provider[] = [
  {
    provide: AUTH_CONFIGURATION,
    useValue: authConfiguration,
  },
  AuthBootstrapService,
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
  exports: [PassportModule],
})
export class AuthModule {}
