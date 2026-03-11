import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class InviterBlockedInviteeError extends CodedApplicationError {
  constructor(message: string = `Inviter blocked invitee`) {
    super(ApplicationErrorCode.INVITER_BLOCKED_INVITEE, message);
    this.name = 'InviterBlockedInviteeError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InviterBlockedInviteeError);
    }
  }
}
