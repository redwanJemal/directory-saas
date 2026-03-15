import { THROTTLE_KEY, SKIP_THROTTLE_KEY, Throttle, SkipThrottle } from './throttle.decorator';

describe('Throttle Decorators', () => {
  describe('@Throttle()', () => {
    it('should set metadata with limit and ttl', () => {
      const decorator = Throttle({ limit: 10, ttl: 60 });
      const target = class TestClass {};
      decorator(target);
      const metadata = Reflect.getMetadata(THROTTLE_KEY, target);
      expect(metadata).toEqual({ limit: 10, ttl: 60 });
    });

    it('should set custom limit values', () => {
      const decorator = Throttle({ limit: 5, ttl: 30 });
      const target = class TestClass {};
      decorator(target);
      const metadata = Reflect.getMetadata(THROTTLE_KEY, target);
      expect(metadata).toEqual({ limit: 5, ttl: 30 });
    });
  });

  describe('@SkipThrottle()', () => {
    it('should set skip metadata to true', () => {
      const decorator = SkipThrottle();
      const target = class TestClass {};
      decorator(target);
      const metadata = Reflect.getMetadata(SKIP_THROTTLE_KEY, target);
      expect(metadata).toBe(true);
    });
  });
});
