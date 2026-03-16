import { http, HttpResponse } from 'msw';

const BASE_URL = '/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${BASE_URL}/auth/admin/login`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (body.email === 'admin@test.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: '1',
            email: 'admin@test.com',
            name: 'Test Admin',
            type: 'admin',
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
        id: '1',
        email: 'admin@test.com',
        name: 'Test Admin',
        type: 'admin',
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

  // Tenants (admin)
  http.get(`${BASE_URL}/admin/tenants`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', name: 'Tenant One', slug: 'tenant-one', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
        { id: '2', name: 'Tenant Two', slug: 'tenant-two', status: 'suspended', createdAt: '2026-02-01T00:00:00Z' },
      ],
      pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
    });
  }),

  // Health
  http.get(`${BASE_URL}/health/ready`, () => {
    return HttpResponse.json({
      status: 'ok',
      info: { database: { status: 'up' }, redis: { status: 'up' } },
    });
  }),
];
