import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';
import { AppException } from '../exceptions/app.exception';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
  });

  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(schema);
  });

  describe('valid input', () => {
    it('should return parsed data for valid input', () => {
      const input = { name: 'John', email: 'john@example.com' };
      const result = pipe.transform(input);

      expect(result).toEqual(input);
    });

    it('should strip unknown fields', () => {
      const input = { name: 'John', email: 'john@example.com', extra: 'field' };
      const result = pipe.transform(input);

      expect(result).toEqual({ name: 'John', email: 'john@example.com' });
      expect((result as Record<string, unknown>).extra).toBeUndefined();
    });

    it('should include optional fields when provided', () => {
      const input = { name: 'John', email: 'john@example.com', age: 30 };
      const result = pipe.transform(input);

      expect(result).toEqual({ name: 'John', email: 'john@example.com', age: 30 });
    });
  });

  describe('invalid input', () => {
    it('should throw AppException with VALIDATION_ERROR code', () => {
      const input = { name: 'J', email: 'not-an-email' };

      try {
        pipe.transform(input);
        fail('Expected AppException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        const appError = error as AppException;
        expect(appError.errorCode).toBe('VALIDATION_ERROR');
        expect(appError.getStatus()).toBe(400);
      }
    });

    it('should include field-level error details', () => {
      const input = { name: 'J', email: 'not-an-email' };

      try {
        pipe.transform(input);
        fail('Expected AppException to be thrown');
      } catch (error) {
        const appError = error as AppException;
        const details = appError.details as Array<{ field: string; message: string }>;
        expect(details).toBeInstanceOf(Array);
        expect(details.length).toBeGreaterThanOrEqual(2);

        const fieldNames = details.map((d) => d.field);
        expect(fieldNames).toContain('name');
        expect(fieldNames).toContain('email');

        details.forEach((d) => {
          expect(d).toHaveProperty('field');
          expect(d).toHaveProperty('message');
          expect(typeof d.field).toBe('string');
          expect(typeof d.message).toBe('string');
        });
      }
    });

    it('should throw for missing required fields', () => {
      const input = {};

      try {
        pipe.transform(input);
        fail('Expected AppException to be thrown');
      } catch (error) {
        const appError = error as AppException;
        expect(appError.errorCode).toBe('VALIDATION_ERROR');
        const details = appError.details as Array<{ field: string; message: string }>;
        const fieldNames = details.map((d) => d.field);
        expect(fieldNames).toContain('name');
        expect(fieldNames).toContain('email');
      }
    });

    it('should throw for wrong types', () => {
      const input = { name: 123, email: 'valid@email.com' };

      try {
        pipe.transform(input);
        fail('Expected AppException to be thrown');
      } catch (error) {
        const appError = error as AppException;
        const details = appError.details as Array<{ field: string; message: string }>;
        expect(details.some((d) => d.field === 'name')).toBe(true);
      }
    });
  });

  describe('nested objects', () => {
    it('should handle nested path in error details', () => {
      const nestedSchema = z.object({
        address: z.object({
          city: z.string().min(1),
          zip: z.string().regex(/^\d{5}$/),
        }),
      });
      const nestedPipe = new ZodValidationPipe(nestedSchema);

      try {
        nestedPipe.transform({ address: { city: '', zip: 'abc' } });
        fail('Expected AppException to be thrown');
      } catch (error) {
        const appError = error as AppException;
        const details = appError.details as Array<{ field: string; message: string }>;
        expect(details.some((d) => d.field === 'address.city')).toBe(true);
        expect(details.some((d) => d.field === 'address.zip')).toBe(true);
      }
    });
  });
});
