import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class InviteRejectedError extends CodedApplicationError {
  constructor(message: string = `Invite rejected`) {
    super(ApplicationErrorCode.INVITE_REJECTED, message);
    this.name = 'InviteRejectedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviteRejectedError);
    }
  }
}
