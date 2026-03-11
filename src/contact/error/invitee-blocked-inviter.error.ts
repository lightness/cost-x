import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class InviteeBlockedInviterError extends CodedApplicationError {
  constructor(message: string = `Invitee blocked inviter`) {
    super(ApplicationErrorCode.INVITEE_BLOCKED_INVITER, message);
    this.name = 'InviteeBlockedInviterError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviteeBlockedInviterError);
    }
  }
}
