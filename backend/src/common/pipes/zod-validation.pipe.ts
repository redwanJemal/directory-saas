import { PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { AppException } from '../exceptions/app.exception';
import { ErrorCodes } from '../constants/error-codes';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      );
    }
    return result.data;
  }
}
