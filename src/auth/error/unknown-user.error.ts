import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class UnknownUserError extends CodedApplicationError {
  constructor(message: string = `Unknown user`) {
    super(ApplicationErrorCode.UNKNOWN_USER, message);
    this.name = 'UnknownUserError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnknownUserError);
    }
  }
}
