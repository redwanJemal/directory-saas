/**
 * Custom assertion helpers for API response envelope validation.
 * Use these in E2E tests to verify response structure.
 */

/**
 * Asserts that the response body matches the success envelope structure.
 */
export function expectSuccessResponse(body: Record<string, unknown>): void {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('timestamp');
  expect(typeof body.timestamp).toBe('string');
}

/**
 * Asserts that the response body matches the paginated success envelope structure.
 */
export function expectPaginatedResponse(
  body: Record<string, unknown>,
  expectedPage = 1,
): void {
  expectSuccessResponse(body);
  expect(body).toHaveProperty('pagination');
  const pagination = body.pagination as Record<string, unknown>;
  expect(pagination).toHaveProperty('page', expectedPage);
  expect(pagination).toHaveProperty('pageSize');
  expect(pagination).toHaveProperty('totalCount');
  expect(pagination).toHaveProperty('totalPages');
  expect(typeof pagination.totalCount).toBe('number');
  expect(typeof pagination.totalPages).toBe('number');
  expect(Array.isArray(body.data)).toBe(true);
}

/**
 * Asserts that the response body matches the error envelope structure.
 */
export function expectErrorResponse(
  body: Record<string, unknown>,
  expectedCode?: string,
): void {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  const error = body.error as Record<string, unknown>;
  expect(error).toHaveProperty('code');
  expect(error).toHaveProperty('message');
  if (expectedCode) {
    expect(error.code).toBe(expectedCode);
  }
}

/**
 * Asserts that a data object has valid UUID format for its id field.
 */
export function expectValidUuid(data: Record<string, unknown>): void {
  expect(data).toHaveProperty('id');
  expect(typeof data.id).toBe('string');
  expect(data.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
}

/**
 * Asserts that a data object has valid timestamp fields.
 */
export function expectTimestamps(data: Record<string, unknown>): void {
  expect(data).toHaveProperty('createdAt');
  expect(data).toHaveProperty('updatedAt');
}
