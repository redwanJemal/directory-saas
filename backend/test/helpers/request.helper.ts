import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

/**
 * Creates a pre-configured supertest agent with auth headers.
 * Use for making authenticated requests in E2E tests.
 */
export function authenticatedRequest(
  app: INestApplication,
  accessToken: string,
) {
  const server = app.getHttpServer();

  return {
    get: (url: string) =>
      request(server)
        .get(url)
        .set('Authorization', `Bearer ${accessToken}`),

    post: (url: string) =>
      request(server)
        .post(url)
        .set('Authorization', `Bearer ${accessToken}`),

    patch: (url: string) =>
      request(server)
        .patch(url)
        .set('Authorization', `Bearer ${accessToken}`),

    put: (url: string) =>
      request(server)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`),

    delete: (url: string) =>
      request(server)
        .delete(url)
        .set('Authorization', `Bearer ${accessToken}`),
  };
}

/**
 * Creates a pre-configured supertest agent with auth + tenant headers.
 * Use for making tenant-scoped authenticated requests.
 */
export function tenantRequest(
  app: INestApplication,
  accessToken: string,
  tenantId: string,
) {
  const server = app.getHttpServer();

  return {
    get: (url: string) =>
      request(server)
        .get(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId),

    post: (url: string) =>
      request(server)
        .post(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId),

    patch: (url: string) =>
      request(server)
        .patch(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId),

    put: (url: string) =>
      request(server)
        .put(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId),

    delete: (url: string) =>
      request(server)
        .delete(url)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId),
  };
}
