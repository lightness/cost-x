import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.UNAUTHORIZED)
export class UserBannedError extends CodedApplicationError {
  constructor(message: string = `User banned`) {
    super(ApplicationErrorCode.USER_BANNED, message);
    this.name = 'UserBannedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserBannedError);
    }
  }
}
