import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.UNAUTHORIZED)
export class EmailNotVerifiedError extends CodedApplicationError {
  constructor(message: string = `Email is not verified`) {
    super(ApplicationErrorCode.EMAIL_IS_NOT_VERIFIED, message);
    this.name = 'EmailNotVerifiedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailNotVerifiedError);
    }
  }
}
