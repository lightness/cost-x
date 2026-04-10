import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class InviteeNotAContactError extends CodedApplicationError {
  constructor(message = 'Invitee is not in your contact list') {
    super(ApplicationErrorCode.INVITEE_NOT_A_CONTACT, message);
    this.name = 'InviteeNotAContactError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviteeNotAContactError);
    }
  }
}
