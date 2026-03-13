import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class ImproperInviteStatusError extends CodedApplicationError {
  constructor(message: string = `Invite is in improper status`) {
    super(ApplicationErrorCode.IMPROPER_INVITE_STATUS, message);
    this.name = 'ImproperInviteStatusError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImproperInviteStatusError);
    }
  }
}
