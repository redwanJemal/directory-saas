import { randomBytes } from 'crypto';

let counter = 0;

/**
 * Generates a short random ID suitable for test data.
 * Combines a counter with random bytes for uniqueness.
 */
export function randomId(): string {
  counter++;
  return `${counter}-${randomBytes(4).toString('hex')}`;
}

/**
 * Generates a unique random email address for test data.
 */
export function randomEmail(prefix = 'user'): string {
  return `${prefix}-${randomId()}@test.com`;
}

/**
 * Resets the counter (call in beforeEach if needed for deterministic tests).
 */
export function resetCounter(): void {
  counter = 0;
}
