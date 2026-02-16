import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class UniqueConstraintViolationError extends CodedApplicationError {
  constructor(
    fields: string[],
    message: string = fields.length > 1
      ? `Fields combination ${fields.map((field) => `"${field}"`).join(', ')} have to be unique`
      : `Field "${fields.join()}" have to be unique`,
  ) {
    super(ApplicationErrorCode.UNIQUE_CONSTRAINT_VIOLATION, message);
    this.name = 'UniqueConstraintViolationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UniqueConstraintViolationError);
    }
  }
}
