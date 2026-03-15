import { SetMetadata } from '@nestjs/common';

export interface ThrottleOptions {
  limit: number;
  ttl: number;
}

export const THROTTLE_KEY = 'throttle';
export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * Override rate limit for a specific handler or controller.
 * @param options - { limit: max requests, ttl: window in seconds }
 */
export const Throttle = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_KEY, options);

/**
 * Skip rate limiting for a specific handler or controller.
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
