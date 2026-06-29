import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Registers OpenAPI documentation at /api/docs. */
export function setupSwagger(app: INestApplication, apiPrefix: string): void {
  const config = new DocumentBuilder()
    .setTitle('AgencyOS API')
    .setDescription(
      'REST API for AgencyOS — enterprise operating system for digital marketing agencies.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Keycloak JWT access token',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-tenant-id',
        description: 'Tenant scope header (development)',
      },
      'tenant',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-workspace-id',
        description: 'Workspace scope header (development)',
      },
      'workspace',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
