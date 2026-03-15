import { HttpException } from '@nestjs/common';
import { ErrorCodeHttpStatus } from '../constants/error-codes';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly details?: unknown,
    statusCode?: number,
  ) {
    super(
      { errorCode, message, details },
      statusCode ?? ErrorCodeHttpStatus[errorCode] ?? 500,
    );
  }
}
