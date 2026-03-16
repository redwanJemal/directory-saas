import { http, HttpResponse } from 'msw';

const BASE_URL = '/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/auth/tenant/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (body.email === 'provider@test.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: '2',
            email: 'provider@test.com',
            name: 'Test Provider',
            type: 'tenant',
            tenantId: 'tenant-1',
            tenantSlug: 'test-tenant',
          },
        },
      });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
      { status: 401 },
    );
  }),

  http.get(`${BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '2',
        email: 'provider@test.com',
        name: 'Test Provider',
        type: 'tenant',
        tenantId: 'tenant-1',
        tenantSlug: 'test-tenant',
      },
    });
  }),

  http.post(`${BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });
  }),

  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Health
  http.get(`${BASE_URL}/health/ready`, () => {
    return HttpResponse.json({
      status: 'ok',
      info: { database: { status: 'up' }, redis: { status: 'up' } },
    });
  }),
];
