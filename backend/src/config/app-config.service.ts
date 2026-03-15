import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get appPort(): number {
    return this.configService.get<number>('APP_PORT', 3000);
  }

  get appName(): string {
    return this.configService.get<string>('APP_NAME', 'Directory SaaS');
  }

  get apiPrefix(): string {
    return this.configService.get<string>('API_PREFIX', 'api/v1');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get database(): { url: string } {
    return {
      url: this.configService.getOrThrow<string>('DATABASE_URL'),
    };
  }

  get redis(): { host: string; port: number; password?: string } {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    };
  }

  get jwt(): {
    secret: string;
    expiration: string;
    refreshSecret: string;
    refreshExpiration: string;
  } {
    return {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiration: this.configService.get<string>('JWT_EXPIRATION', '15m'),
      refreshSecret:
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      refreshExpiration: this.configService.get<string>(
        'JWT_REFRESH_EXPIRATION',
        '7d',
      ),
    };
  }

  get cors(): { origins: string[] } {
    const origins = this.configService.get<string>(
      'CORS_ORIGINS',
      'http://localhost:3000,http://localhost:3001,http://localhost:3002',
    );
    return { origins: origins.split(',').map((o) => o.trim()) };
  }

  get s3(): {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
  } {
    return {
      endpoint: this.configService.get<string>(
        'S3_ENDPOINT',
        'http://localhost:9000',
      ),
      accessKey: this.configService.get<string>('S3_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('S3_SECRET_KEY', 'minioadmin'),
      bucket: this.configService.get<string>('S3_BUCKET', 'directory-saas'),
      region: this.configService.get<string>('S3_REGION', 'us-east-1'),
    };
  }

  get meilisearch(): { url: string; apiKey: string } {
    return {
      url: this.configService.get<string>(
        'MEILISEARCH_URL',
        'http://localhost:7700',
      ),
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY', ''),
    };
  }

  get smtp(): {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  } {
    return {
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 1025),
      user: this.configService.get<string>('SMTP_USER', ''),
      pass: this.configService.get<string>('SMTP_PASS', ''),
      from: this.configService.get<string>(
        'SMTP_FROM',
        'noreply@directory-saas.local',
      ),
    };
  }

  get throttle(): { ttl: number; limit: number } {
    return {
      ttl: this.configService.get<number>('THROTTLE_TTL', 60),
      limit: this.configService.get<number>('THROTTLE_LIMIT', 100),
    };
  }

  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'log');
  }
}
