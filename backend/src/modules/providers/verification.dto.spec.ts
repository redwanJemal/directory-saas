import { SubmitVerificationSchema } from './dto/submit-verification.dto';
import { ReviewVerificationSchema } from './dto/review-verification.dto';

describe('SubmitVerificationSchema', () => {
  it('should accept valid submission with all fields', () => {
    const result = SubmitVerificationSchema.safeParse({
      tradeLicenseUrl: 'https://example.com/license.pdf',
      documentUrls: ['https://example.com/doc1.pdf', 'https://example.com/doc2.pdf'],
      notes: 'Please verify my business',
    });
    expect(result.success).toBe(true);
  });

  it('should accept minimal submission with no fields', () => {
    const result = SubmitVerificationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject invalid tradeLicenseUrl', () => {
    const result = SubmitVerificationSchema.safeParse({
      tradeLicenseUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid documentUrls entries', () => {
    const result = SubmitVerificationSchema.safeParse({
      documentUrls: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('should reject more than 10 document URLs', () => {
    const result = SubmitVerificationSchema.safeParse({
      documentUrls: Array.from({ length: 11 }, (_, i) => `https://example.com/doc${i}.pdf`),
    });
    expect(result.success).toBe(false);
  });

  it('should reject notes longer than 1000 characters', () => {
    const result = SubmitVerificationSchema.safeParse({
      notes: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe('ReviewVerificationSchema', () => {
  it('should accept approved status', () => {
    const result = ReviewVerificationSchema.safeParse({
      status: 'approved',
      adminNotes: 'Looks good',
    });
    expect(result.success).toBe(true);
  });

  it('should accept rejected status', () => {
    const result = ReviewVerificationSchema.safeParse({
      status: 'rejected',
      adminNotes: 'Missing documents',
    });
    expect(result.success).toBe(true);
  });

  it('should accept without adminNotes', () => {
    const result = ReviewVerificationSchema.safeParse({
      status: 'approved',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = ReviewVerificationSchema.safeParse({
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing status', () => {
    const result = ReviewVerificationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject adminNotes longer than 1000 characters', () => {
    const result = ReviewVerificationSchema.safeParse({
      status: 'approved',
      adminNotes: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
