import { AUDITED_KEY, Audited } from './audited.decorator';

describe('Audited decorator', () => {
  it('should set metadata with empty options when called without arguments', () => {
    @Audited()
    class TestController {
      handler() {}
    }

    const metadata = Reflect.getMetadata(AUDITED_KEY, TestController);
    expect(metadata).toEqual({});
  });

  it('should set metadata with entity option', () => {
    class TestController {
      @Audited({ entity: 'custom-entity' })
      handler() {}
    }

    const instance = new TestController();
    const metadata = Reflect.getMetadata(
      AUDITED_KEY,
      TestController.prototype.handler,
    );
    expect(metadata).toEqual({ entity: 'custom-entity' });
  });

  it('should be detectable via Reflect.getMetadata', () => {
    class TestController {
      @Audited()
      audited() {}

      notAudited() {}
    }

    const auditedMeta = Reflect.getMetadata(
      AUDITED_KEY,
      TestController.prototype.audited,
    );
    const notAuditedMeta = Reflect.getMetadata(
      AUDITED_KEY,
      TestController.prototype.notAudited,
    );

    expect(auditedMeta).toBeDefined();
    expect(notAuditedMeta).toBeUndefined();
  });
});
