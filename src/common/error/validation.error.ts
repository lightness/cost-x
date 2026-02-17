import { ValidationError as ClassValidatorError } from 'class-validator';
import { ApplicationErrorCode } from './coded-application.error';
import { DetailedApplicationError } from './detailed-application.error';

export class ValidationError extends DetailedApplicationError<
  ClassValidatorError[]
> {
  constructor(
    classValidatorErrors: ClassValidatorError[],
    message: string = `Invalid input`,
  ) {
    super(classValidatorErrors, ApplicationErrorCode.VALIDATION, message);
    this.name = 'ValidationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
