import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application-error';

export class InvalidCredentialsError extends CodedApplicationError {
  constructor(message: string = `Invalid email or password`) {
    super(ApplicationErrorCode.INVALID_CREDENTIALS, message);
    this.name = 'InvalidCredentialsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidCredentialsError);
    }
  }
}
