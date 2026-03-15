import { Logger } from '@nestjs/common';
import { configSchema, AppConfig } from './config.schema';

let validatedConfig: AppConfig | null = null;

export function validateConfig(
  config: Record<string, unknown>,
): AppConfig {
  const result = configSchema.safeParse(config);

  if (!result.success) {
    const logger = new Logger('ConfigValidation');
    const errors = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );

    logger.error('Environment validation failed:');
    errors.forEach((err) => logger.error(err));

    throw new Error(
      `Configuration validation failed:\n${errors.join('\n')}`,
    );
  }

  validatedConfig = result.data;
  return result.data;
}

export function getValidatedConfig(): AppConfig {
  if (!validatedConfig) {
    throw new Error(
      'Configuration has not been validated yet. Ensure ConfigModule is loaded.',
    );
  }
  return validatedConfig;
}
