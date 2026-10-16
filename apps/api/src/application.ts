import 'reflect-metadata';
import { ConsoleLogger, type LoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { requestLogging } from './observability/request-logging';

export async function createApplication(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  logger: LoggerService = new ConsoleLogger({ json: true }),
): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(environment),
    { logger, abortOnError: false, bodyParser: false },
  );
  app.disable('x-powered-by');
  app.use(requestLogging(logger));
  app.enableShutdownHooks();

  const server = app.getHttpServer();
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  return app;
}
