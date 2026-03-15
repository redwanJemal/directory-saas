import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let configService: ConfigService;

  const mockConfigValues: Record<string, string | number> = {
    NODE_ENV: 'development',
    APP_PORT: 3333,
    APP_NAME: 'Directory SaaS',
    API_PREFIX: 'api/v1',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: 'secret',
    JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long',
    JWT_EXPIRATION: '15m',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars',
    JWT_REFRESH_EXPIRATION: '7d',
    CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
    S3_ENDPOINT: 'http://localhost:9000',
    S3_ACCESS_KEY: 'minioadmin',
    S3_SECRET_KEY: 'minioadmin',
    S3_BUCKET: 'test-bucket',
    S3_REGION: 'us-east-1',
    MEILISEARCH_URL: 'http://localhost:7700',
    MEILISEARCH_API_KEY: 'test-key',
    SMTP_HOST: 'localhost',
    SMTP_PORT: 1025,
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: 'noreply@test.local',
    THROTTLE_TTL: 60,
    THROTTLE_LIMIT: 100,
    LOG_LEVEL: 'log',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              return key in mockConfigValues
                ? mockConfigValues[key]
                : defaultValue;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (!(key in mockConfigValues)) {
                throw new Error(`Missing config key: ${key}`);
              }
              return mockConfigValues[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic properties', () => {
    it('should return nodeEnv', () => {
      expect(service.nodeEnv).toBe('development');
    });

    it('should return appPort', () => {
      expect(service.appPort).toBe(3333);
    });

    it('should return appName', () => {
      expect(service.appName).toBe('Directory SaaS');
    });

    it('should return apiPrefix', () => {
      expect(service.apiPrefix).toBe('api/v1');
    });
  });

  describe('environment checks', () => {
    it('should return isDevelopment=true in development', () => {
      expect(service.isDevelopment).toBe(true);
      expect(service.isProduction).toBe(false);
      expect(service.isTest).toBe(false);
    });
  });

  describe('database config', () => {
    it('should return database url', () => {
      expect(service.database.url).toBe(
        'postgresql://user:pass@localhost:5432/db',
      );
    });
  });

  describe('redis config', () => {
    it('should return redis connection info', () => {
      const redis = service.redis;
      expect(redis.host).toBe('localhost');
      expect(redis.port).toBe(6379);
      expect(redis.password).toBe('secret');
    });
  });

  describe('jwt config', () => {
    it('should return jwt settings', () => {
      const jwt = service.jwt;
      expect(jwt.secret).toBe('test-jwt-secret-at-least-32-chars-long');
      expect(jwt.expiration).toBe('15m');
      expect(jwt.refreshSecret).toBe(
        'test-refresh-secret-at-least-32-chars',
      );
      expect(jwt.refreshExpiration).toBe('7d');
    });
  });

  describe('cors config', () => {
    it('should parse comma-separated origins into array', () => {
      const cors = service.cors;
      expect(cors.origins).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
    });
  });

  describe('s3 config', () => {
    it('should return s3 settings', () => {
      const s3 = service.s3;
      expect(s3.endpoint).toBe('http://localhost:9000');
      expect(s3.accessKey).toBe('minioadmin');
      expect(s3.secretKey).toBe('minioadmin');
      expect(s3.bucket).toBe('test-bucket');
      expect(s3.region).toBe('us-east-1');
    });
  });

  describe('smtp config', () => {
    it('should return smtp settings', () => {
      const smtp = service.smtp;
      expect(smtp.host).toBe('localhost');
      expect(smtp.port).toBe(1025);
      expect(smtp.from).toBe('noreply@test.local');
    });
  });

  describe('throttle config', () => {
    it('should return throttle settings', () => {
      const throttle = service.throttle;
      expect(throttle.ttl).toBe(60);
      expect(throttle.limit).toBe(100);
    });
  });

  describe('meilisearch config', () => {
    it('should return meilisearch settings', () => {
      const meili = service.meilisearch;
      expect(meili.url).toBe('http://localhost:7700');
      expect(meili.apiKey).toBe('test-key');
    });
  });

  describe('logLevel', () => {
    it('should return log level', () => {
      expect(service.logLevel).toBe('log');
    });
  });
});
