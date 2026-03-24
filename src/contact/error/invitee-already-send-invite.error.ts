import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class InviteeAlreadySendInviteError extends CodedApplicationError {
  constructor(message: string = `Invitee already send invite`) {
    super(ApplicationErrorCode.INVITEE_ALREADY_SEND_INVITE, message);
    this.name = 'InviteeAlreadySendInviteError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviteeAlreadySendInviteError);
    }
  }
}
