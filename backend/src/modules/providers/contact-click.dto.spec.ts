import { RecordContactClickSchema } from './dto';

describe('RecordContactClickSchema', () => {
  it('should accept valid whatsapp type', () => {
    const result = RecordContactClickSchema.safeParse({ type: 'whatsapp' });
    expect(result.success).toBe(true);
  });

  it('should accept valid phone type', () => {
    const result = RecordContactClickSchema.safeParse({ type: 'phone' });
    expect(result.success).toBe(true);
  });

  it('should accept valid email type', () => {
    const result = RecordContactClickSchema.safeParse({ type: 'email' });
    expect(result.success).toBe(true);
  });

  it('should accept valid website type', () => {
    const result = RecordContactClickSchema.safeParse({ type: 'website' });
    expect(result.success).toBe(true);
  });

  it('should accept valid instagram type', () => {
    const result = RecordContactClickSchema.safeParse({ type: 'instagram' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid type', () => {
    const result = RecordContactClickSchema.safeParse({ type: 'telegram' });
    expect(result.success).toBe(false);
  });

  it('should reject empty body', () => {
    const result = RecordContactClickSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject missing type', () => {
    const result = RecordContactClickSchema.safeParse({ type: '' });
    expect(result.success).toBe(false);
  });
});
