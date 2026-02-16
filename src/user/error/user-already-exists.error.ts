import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class UserAlreadyExistsError extends CodedApplicationError {
  constructor(message: string = `User already exists`) {
    super(ApplicationErrorCode.USER_ALREADY_EXISTS, message);
    this.name = 'UserAlreadyExistsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserAlreadyExistsError);
    }
  }
}
