import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.UNAUTHORIZED)
export class UserNotAuthorizedError extends CodedApplicationError {
  constructor(message: string = `User is not authorized`) {
    super(ApplicationErrorCode.USER_NOT_AUTHORIZED, message);
    this.name = 'UserNotAuthorizedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserNotAuthorizedError);
    }
  }
}
