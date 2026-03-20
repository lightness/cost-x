import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class ContactAlreadyRemovedError extends CodedApplicationError {
  constructor(message: string = `Contact already removed`) {
    super(ApplicationErrorCode.CONTACT_ALREADY_REMOVED, message);
    this.name = 'ContactAlreadyRemovedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContactAlreadyRemovedError);
    }
  }
}
