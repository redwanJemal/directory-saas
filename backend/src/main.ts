import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { AppLoggerService } from './common/services/logger.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  // Global prefix
  app.setGlobalPrefix(config.apiPrefix);

  // Security
  app.use(helmet());

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
