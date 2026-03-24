import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class UserIsNotBlockedError extends CodedApplicationError {
  constructor(message: string = `User is not blocked`) {
    super(ApplicationErrorCode.USER_IS_NOT_BLOCKED, message);
    this.name = 'UserIsNotBlockedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserIsNotBlockedError);
    }
  }
}
