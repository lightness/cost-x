import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class InviterAlreadySendInviteError extends CodedApplicationError {
  constructor(message: string = `Inviter already send invite`) {
    super(ApplicationErrorCode.INVITER_ALREADY_SEND_INVITE, message);
    this.name = 'InviterAlreadySendInviteError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviterAlreadySendInviteError);
    }
  }
}
