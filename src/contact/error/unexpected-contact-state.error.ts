import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class UnexpectedContactStateError extends CodedApplicationError {
  constructor(message: string = `Unexpected contact state`) {
    super(ApplicationErrorCode.UNEXPECTED_CONTACT_STATE, message);
    this.name = 'UnexpectedContactStateError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnexpectedContactStateError);
    }
  }
}
