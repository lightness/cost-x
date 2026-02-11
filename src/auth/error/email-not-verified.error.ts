import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application-error';

export class EmailNotVerifiedError extends CodedApplicationError {
  constructor(message: string = `Email is not verified`) {
    super(ApplicationErrorCode.EMAIL_IS_NOT_VERIFIED, message);
    this.name = 'EmailNotVerifiedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailNotVerifiedError);
    }
  }
}
