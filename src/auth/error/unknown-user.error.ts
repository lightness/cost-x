import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.UNAUTHORIZED)
export class UnknownUserError extends CodedApplicationError {
  constructor(message: string = `Unknown user`) {
    super(ApplicationErrorCode.UNKNOWN_USER, message);
    this.name = 'UnknownUserError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnknownUserError);
    }
  }
}
