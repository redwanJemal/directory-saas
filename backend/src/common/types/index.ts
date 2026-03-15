import { AppException } from '../exceptions/app.exception';

export class ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };

  private constructor(
    success: boolean,
    data?: T,
    error?: { code: string; message: string; details?: unknown },
  ) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  static ok<T>(data: T): ServiceResult<T> {
    return new ServiceResult<T>(true, data);
  }

  static fail<T>(code: string, message: string, details?: unknown): ServiceResult<T> {
    return new ServiceResult<T>(false, undefined, { code, message, details });
  }

  toHttpException(): AppException {
    if (!this.error) {
      return new AppException('INTERNAL_ERROR', 'Unknown error');
    }

    return new AppException(
      this.error.code,
      this.error.message,
      this.error.details,
    );
  }
}
