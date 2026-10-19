export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly host: '127.0.0.1';
  readonly port: number;
  readonly readOnly: true;
}

export class ConfigurationError extends Error {
  constructor(field: string, requirement: string) {
    super(`Invalid configuration: ${field} ${requirement}`);
    this.name = 'ConfigurationError';
  }
}

export function validateEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): Readonly<AppConfig> {
  if (
    Object.keys(environment).some(
      (key) => key.toUpperCase().startsWith('IOL_') && key !== 'IOL_READ_ONLY',
    )
  ) {
    // Reject even empty obsolete placeholders; never echo names or values.
    throw new ConfigurationError(
      'broker environment',
      'is forbidden in the API process',
    );
  }
  const nodeEnv = environment.NODE_ENV ?? 'development';
  if (
    nodeEnv !== 'development' &&
    nodeEnv !== 'test' &&
    nodeEnv !== 'production'
  ) {
    throw new ConfigurationError(
      'NODE_ENV',
      'must be development, test, or production',
    );
  }

  const portValue = environment.PORT ?? '3000';
  if (!/^\d+$/.test(portValue)) {
    throw new ConfigurationError('PORT', 'must be an integer from 1 to 65535');
  }
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigurationError('PORT', 'must be an integer from 1 to 65535');
  }

  if ((environment.HOST ?? '127.0.0.1') !== '127.0.0.1') {
    throw new ConfigurationError('HOST', 'must be 127.0.0.1 during Phase 0');
  }
  if ((environment.IOL_READ_ONLY ?? 'true') !== 'true') {
    throw new ConfigurationError(
      'IOL_READ_ONLY',
      'must be true during Phase 0',
    );
  }

  return Object.freeze({ nodeEnv, port, host: '127.0.0.1', readOnly: true });
}
