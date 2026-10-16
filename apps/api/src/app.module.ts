import { Module, type DynamicModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './modules/health/health.module';

@Module({})
export class AppModule {
  static register(
    environment: Readonly<Record<string, string | undefined>>,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(environment),
        HealthModule,
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
      ],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    };
  }
}
