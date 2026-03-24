import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class UserIsAlreadyBlockedError extends CodedApplicationError {
  constructor(message: string = `User is already blocked`) {
    super(ApplicationErrorCode.USER_IS_ALREADY_BLOCKED, message);
    this.name = 'UserIsAlreadyBlockedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserIsAlreadyBlockedError);
    }
  }
}
