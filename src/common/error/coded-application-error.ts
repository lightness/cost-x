import { ApplicationError } from './application-error';

export enum ApplicationErrorCode {
  EMAIL_IS_NOT_VERIFIED = 'email_is_not_verified',
  USER_BANNED = 'user_banned',
  USER_ALREADY_EXISTS = 'user_already_exists',
  INVALID_CREDENTIALS = 'invalid_credentials',
  INVALID_REFRESH_TOKEN = 'invalid_refresh_token',
  UNKNOWN_USER = 'unknown_user',
  UNIQUE_CONSTRAINT_VIOLATION = 'unique_constraint_violation',
  UNKNOWN = 'unknown',
}

export class CodedApplicationError extends ApplicationError {
  public readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message: string) {
    super(message);
    this.name = 'CodedApplicationError';
    this.code = code;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodedApplicationError);
    }
  }
}
