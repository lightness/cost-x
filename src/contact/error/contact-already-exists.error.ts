import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class ContactAlreadyExistsError extends CodedApplicationError {
  constructor(message: string = `Contact already exists`) {
    super(ApplicationErrorCode.CONTACT_ALREADY_EXISTS, message);
    this.name = 'ContactAlreadyExistsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContactAlreadyExistsError);
    }
  }
}
