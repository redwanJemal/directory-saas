import { Inject } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

const CACHE_SERVICE_PROPERTY = '__cacheService__';

export interface CacheableOptions {
  namespace: string;
  ttl?: number;
  keyGenerator?: (...args: unknown[]) => string;
}

export interface CacheEvictOptions {
  namespace: string;
  keyGenerator?: (...args: unknown[]) => string;
}

function ensureCacheService(target: object): void {
  if (!Object.getOwnPropertyDescriptor(target.constructor, '__cacheServiceInjected__')) {
    Inject(CacheService)(target, CACHE_SERVICE_PROPERTY);
    Object.defineProperty(target.constructor, '__cacheServiceInjected__', { value: true });
  }
}

export function Cacheable(options: CacheableOptions) {
  return function (
    target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    ensureCacheService(target);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: Record<string, unknown>, ...args: unknown[]) {
      const cacheService = this[CACHE_SERVICE_PROPERTY] as CacheService | undefined;
      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      const tenantId = args[0] as string;
      const cacheKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : args.slice(1).join(':');

      return cacheService.getOrSet(
        tenantId,
        options.namespace,
        cacheKey,
        () => originalMethod.apply(this, args) as Promise<unknown>,
        options.ttl,
      );
    };

    return descriptor;
  };
}

export function CacheEvict(options: CacheEvictOptions) {
  return function (
    target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    ensureCacheService(target);

    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;

    descriptor.value = async function (this: Record<string, unknown>, ...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      const cacheService = this[CACHE_SERVICE_PROPERTY] as CacheService | undefined;
      if (cacheService) {
        const tenantId = args[0] as string;
        const cacheKey = options.keyGenerator
          ? options.keyGenerator(...args)
          : args.slice(1).join(':');

        await cacheService.del(tenantId, options.namespace, cacheKey);
      }

      return result;
    };

    return descriptor;
  };
}
