import { configSchema } from './config.schema';
import { validateConfig } from './config.loader';

const validEnv: Record<string, unknown> = {
  NODE_ENV: 'development',
  APP_PORT: '3333',
  APP_NAME: 'Directory SaaS',
  API_PREFIX: 'api/v1',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-characters',
  JWT_EXPIRATION: '15m',
  JWT_REFRESH_SECRET: 'another-very-long-secret-at-least-32-characters',
  JWT_REFRESH_EXPIRATION: '7d',
  CORS_ORIGINS: 'http://localhost:3000',
  LOG_LEVEL: 'log',
};

describe('Config Schema', () => {
  describe('validation succeeds', () => {
    it('should accept a complete valid config', () => {
      const result = configSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it('should apply defaults for optional fields', () => {
      const minimal = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
        JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-characters',
        JWT_REFRESH_SECRET:
          'another-very-long-secret-at-least-32-characters',
      };
      const result = configSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.APP_PORT).toBe(3000);
        expect(result.data.APP_NAME).toBe('Directory SaaS');
        expect(result.data.REDIS_HOST).toBe('localhost');
        expect(result.data.REDIS_PORT).toBe(6379);
        expect(result.data.JWT_EXPIRATION).toBe('15m');
        expect(result.data.JWT_REFRESH_EXPIRATION).toBe('7d');
        expect(result.data.SMTP_PORT).toBe(1025);
        expect(result.data.THROTTLE_TTL).toBe(60);
        expect(result.data.THROTTLE_LIMIT).toBe(100);
        expect(result.data.LOG_LEVEL).toBe('log');
      }
    });

    it('should coerce string numbers to numbers', () => {
      const result = configSchema.safeParse({
        ...validEnv,
        APP_PORT: '8080',
        REDIS_PORT: '6380',
        SMTP_PORT: '587',
        THROTTLE_TTL: '120',
        THROTTLE_LIMIT: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.APP_PORT).toBe(8080);
        expect(result.data.REDIS_PORT).toBe(6380);
        expect(result.data.SMTP_PORT).toBe(587);
        expect(result.data.THROTTLE_TTL).toBe(120);
        expect(result.data.THROTTLE_LIMIT).toBe(50);
      }
    });
  });

  describe('validation rejects missing required vars', () => {
    it('should reject missing DATABASE_URL', () => {
      const env = { ...validEnv };
      delete env.DATABASE_URL;
      const result = configSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject missing JWT_SECRET', () => {
      const env = { ...validEnv };
      delete env.JWT_SECRET;
      const result = configSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it('should reject missing JWT_REFRESH_SECRET', () => {
      const env = { ...validEnv };
      delete env.JWT_REFRESH_SECRET;
      const result = configSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe('validation rejects invalid types', () => {
    it('should reject invalid NODE_ENV value', () => {
      const result = configSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'staging',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid DATABASE_URL (not a URL)', () => {
      const result = configSchema.safeParse({
        ...validEnv,
        DATABASE_URL: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject JWT_SECRET shorter than 32 chars', () => {
      const result = configSchema.safeParse({
        ...validEnv,
        JWT_SECRET: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should reject JWT_REFRESH_SECRET shorter than 32 chars', () => {
      const result = configSchema.safeParse({
        ...validEnv,
        JWT_REFRESH_SECRET: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid LOG_LEVEL value', () => {
      const result = configSchema.safeParse({
        ...validEnv,
        LOG_LEVEL: 'trace',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('validateConfig', () => {
  it('should return validated config for valid input', () => {
    const result = validateConfig(validEnv);
    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(result.NODE_ENV).toBe('development');
  });

  it('should throw on invalid input with descriptive message', () => {
    const invalidEnv = { ...validEnv };
    delete invalidEnv.DATABASE_URL;
    delete invalidEnv.JWT_SECRET;

    expect(() => validateConfig(invalidEnv)).toThrow(
      'Configuration validation failed',
    );
  });
});
