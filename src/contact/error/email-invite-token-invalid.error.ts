import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class EmailInviteTokenInvalidError extends CodedApplicationError {
  constructor(message: string = 'Token is invalid') {
    super(ApplicationErrorCode.EMAIL_INVITE_TOKEN_INVALID, message);
    this.name = 'EmailInviteTokenInvalidError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailInviteTokenInvalidError);
    }
  }
}
