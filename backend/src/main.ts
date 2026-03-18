import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { AppLoggerService } from './common/services/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const config = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  // Global prefix (exclude SEO routes like sitemap.xml and robots.txt)
  app.setGlobalPrefix(config.apiPrefix, {
    exclude: ['sitemap.xml', 'robots.txt'],
  });

  // Request size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Security — Helmet
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true },
    }),
  );

  // Global input sanitization (XSS prevention)
  app.useGlobalPipes(new SanitizePipe());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-Tenant-Slug',
      'X-Correlation-ID',
    ],
    exposedHeaders: [
      'X-Correlation-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400,
  });

  // Swagger (non-production only)
  if (!config.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(`${config.appName} API`)
      .setDescription('Multi-tenant directory SaaS platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start
  const port = config.appPort;
  await app.listen(port);
  logger.log(
    `${config.appName} running on port ${port} [${config.nodeEnv}]`,
    'Bootstrap',
  );
}
bootstrap();
