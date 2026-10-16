import { Module, type DynamicModule } from '@nestjs/common';
import { validateEnvironment } from './environment';

export const APP_CONFIG = Symbol('APP_CONFIG');

@Module({})
export class ConfigModule {
  static register(
    environment: Readonly<Record<string, string | undefined>>,
  ): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        { provide: APP_CONFIG, useValue: validateEnvironment(environment) },
      ],
      exports: [APP_CONFIG],
    };
  }
}
