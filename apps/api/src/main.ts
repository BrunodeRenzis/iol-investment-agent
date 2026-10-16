import { ConsoleLogger } from '@nestjs/common';
import { createApplication } from './application';
import { APP_CONFIG } from './config/config.module';
import { ConfigurationError, type AppConfig } from './config/environment';

const logger = new ConsoleLogger({ json: true });

async function bootstrap(): Promise<void> {
  const app = await createApplication(process.env, logger);
  const config = app.get<AppConfig>(APP_CONFIG);
  try {
    await app.listen(config.port, config.host);
  } catch (error: unknown) {
    await app.close();
    throw error;
  }
}

bootstrap().catch((error: unknown) => {
  logger.error(
    error instanceof ConfigurationError
      ? error.message
      : 'Application startup failed; verify configuration and port availability.',
  );
  process.exitCode = 1;
});
