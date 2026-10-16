import { randomUUID } from 'node:crypto';
import type { LoggerService } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export function requestLogging(logger: LoggerService) {
  return (_request: Request, response: Response, next: NextFunction): void => {
    // Generate our own ID instead of trusting a caller-controlled header.
    const requestId = randomUUID();
    const started = performance.now();
    response.setHeader('X-Request-Id', requestId);
    response.once('finish', () => {
      logger.log({
        event: 'http_request_completed',
        requestId,
        statusCode: response.statusCode,
        durationMs: Math.round(performance.now() - started),
      });
    });
    next();
  };
}
