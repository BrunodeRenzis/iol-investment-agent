import { Controller, Get, Header } from '@nestjs/common';

interface HealthResponse {
  readonly status: 'ok';
}

@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
