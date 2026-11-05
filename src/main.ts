import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import {
  HttpException,
  ValidationError,
  ValidationPipe,
  Logger,
} from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = app.get(ConfigService);
  const prefix = config.getOrThrow<string>('app.prefix');

  app.enableCors(config.get('cors'));
  app.setGlobalPrefix(prefix);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const messages = validationErrors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        return new HttpException(messages.join(', '), 400);
      },
    }),
  );

  const swaggerConfig: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle(config.getOrThrow<string>('app.name'))
    .setDescription(config.getOrThrow<string>('app.description'))
    .setVersion(config.getOrThrow<string>('app.version'))
    .addServer(prefix)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
      },
      'auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: true,
  });

  fs.writeFileSync('./swagger.json', JSON.stringify(document));
  SwaggerModule.setup(`${prefix}/swagger`, app, document);

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port);
  new Logger('NestApplication').log(`Listening at ${await app.getUrl()}`);
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('NestApplication');
  logger.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});