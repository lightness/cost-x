import {
  ApplicationErrorCode,
  CodedApplicationError,
} from './coded-application.error';

export abstract class DetailedApplicationError<
  T,
> extends CodedApplicationError {
  public readonly details: T;

  constructor(details: T, code: ApplicationErrorCode, message: string) {
    super(code, message);
    this.name = 'DetailedApplicationError';
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DetailedApplicationError);
    }
  }
}
