import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { setupTestDb, teardownTestDb } from './setup';
import {
  getAdminToken,
  getTenantToken,
  getClientToken,
  authenticatedRequest,
  expectSuccessResponse,
  expectErrorResponse,
} from './helpers';

describe('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global config as main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /api/v1/health should return 200', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);
    });
  });

  describe('Auth Flow', () => {
    it('POST /api/v1/auth/client/register should create a new client', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/client/register')
        .send({
          email: `e2e-register-${Date.now()}@test.com`,
          password: 'TestPassword123!',
          firstName: 'E2E',
          lastName: 'Test',
        })
        .expect(201);

      expectSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('POST /api/v1/auth/client/login should return tokens for valid credentials', async () => {
      const email = `e2e-login-${Date.now()}@test.com`;
      const password = 'TestPassword123!';

      // Register first
      await request(app.getHttpServer())
        .post('/api/v1/auth/client/register')
        .send({ email, password, firstName: 'E2E', lastName: 'Login' })
        .expect(201);

      // Login
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/client/login')
        .send({ email, password })
        .expect(200);

      expectSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('POST /api/v1/auth/client/login should return error for invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/client/login')
        .send({ email: 'nonexistent@test.com', password: 'WrongPassword1!' })
        .expect(401);

      expectErrorResponse(res.body, 'INVALID_CREDENTIALS');
    });
  });

  describe('Protected Routes', () => {
    it('GET /api/v1/auth/me should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expectErrorResponse(res.body, 'UNAUTHORIZED');
    });

    it('GET /api/v1/auth/me should return user profile with valid token', async () => {
      // Register and login
      const email = `e2e-me-${Date.now()}@test.com`;
      const password = 'TestPassword123!';

      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/client/register')
        .send({ email, password, firstName: 'E2E', lastName: 'Me' })
        .expect(201);

      const { accessToken } = registerRes.body.data;

      const res = await authenticatedRequest(app, accessToken)
        .get('/api/v1/auth/me')
        .expect(200);

      expectSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('email', email);
      expect(res.body.data).toHaveProperty('userType', 'client');
    });
  });

  describe('Token Refresh', () => {
    it('POST /api/v1/auth/refresh should rotate tokens', async () => {
      const email = `e2e-refresh-${Date.now()}@test.com`;
      const password = 'TestPassword123!';

      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/client/register')
        .send({ email, password, firstName: 'E2E', lastName: 'Refresh' })
        .expect(201);

      const { refreshToken } = registerRes.body.data;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expectSuccessResponse(res.body);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      // New refresh token should be different from old
      expect(res.body.data.refreshToken).not.toBe(refreshToken);
    });
  });

  describe('Response Envelope', () => {
    it('should wrap successful responses in standard envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should wrap error responses in standard envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/nonexistent-route')
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });
});
