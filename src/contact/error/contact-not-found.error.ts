import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class ContactNotFoundError extends CodedApplicationError {
  constructor(message: string = `Contact not found`) {
    super(ApplicationErrorCode.CONTACT_NOT_FOUND, message);
    this.name = 'ContactNotFoundError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContactNotFoundError);
    }
  }
}
