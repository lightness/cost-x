import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class BlockedUserNotFoundError extends CodedApplicationError {
  constructor(message: string = `Blocked user not found`) {
    super(ApplicationErrorCode.BLOCKED_USER_NOT_FOUND, message);
    this.name = 'BlockedUserNotFoundError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BlockedUserNotFoundError);
    }
  }
}
