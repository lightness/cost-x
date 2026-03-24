import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.UNAUTHORIZED)
export class InvalidCredentialsError extends CodedApplicationError {
  constructor(message: string = `Invalid email or password`) {
    super(ApplicationErrorCode.INVALID_CREDENTIALS, message);
    this.name = 'InvalidCredentialsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidCredentialsError);
    }
  }
}
