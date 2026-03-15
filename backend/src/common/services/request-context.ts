import { AsyncLocalStorage } from 'async_hooks';

export class RequestContext {
  static cls = new AsyncLocalStorage<Map<string, unknown>>();

  static get traceId(): string | undefined {
    return this.get('traceId') as string | undefined;
  }

  static get tenantId(): string | undefined {
    return this.get('tenantId') as string | undefined;
  }

  static get userId(): string | undefined {
    return this.get('userId') as string | undefined;
  }

  static get(key: string): unknown {
    const store = this.cls.getStore();
    return store?.get(key);
  }

  static set(key: string, value: unknown): void {
    const store = this.cls.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  static run<T>(fn: () => T): T {
    return this.cls.run(new Map<string, unknown>(), fn);
  }
}
