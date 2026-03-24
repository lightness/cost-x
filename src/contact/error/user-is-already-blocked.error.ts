import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class UserIsAlreadyBlockedError extends CodedApplicationError {
  constructor(message: string = `User is already blocked`) {
    super(ApplicationErrorCode.USER_IS_ALREADY_BLOCKED, message);
    this.name = 'UserIsAlreadyBlockedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserIsAlreadyBlockedError);
    }
  }
}
