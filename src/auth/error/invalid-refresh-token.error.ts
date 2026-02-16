import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application-error';

export class InvalidRefreshTokenError extends CodedApplicationError {
  constructor(message: string = `Invalid refresh token`) {
    super(ApplicationErrorCode.INVALID_REFRESH_TOKEN, message);
    this.name = 'InvalidRefreshTokenError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidRefreshTokenError);
    }
  }
}
