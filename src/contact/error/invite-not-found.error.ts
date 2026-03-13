import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class InviteNotFoundError extends CodedApplicationError {
  constructor(message: string = `Invite not found`) {
    super(ApplicationErrorCode.INVITE_NOT_FOUND, message);
    this.name = 'InviteNotFoundError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviteNotFoundError);
    }
  }
}
