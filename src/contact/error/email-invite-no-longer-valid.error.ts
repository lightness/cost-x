import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class EmailInviteNoLongerValidError extends CodedApplicationError {
  constructor(message: string = 'Invite is no longer valid') {
    super(ApplicationErrorCode.EMAIL_INVITE_NO_LONGER_VALID, message);
    this.name = 'EmailInviteNoLongerValidError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailInviteNoLongerValidError);
    }
  }
}
