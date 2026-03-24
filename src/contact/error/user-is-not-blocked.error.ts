import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class UserIsNotBlockedError extends CodedApplicationError {
  constructor(message: string = `User is not blocked`) {
    super(ApplicationErrorCode.USER_IS_NOT_BLOCKED, message);
    this.name = 'UserIsNotBlockedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserIsNotBlockedError);
    }
  }
}
