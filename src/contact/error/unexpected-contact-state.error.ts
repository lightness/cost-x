import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class UnexpectedContactStateError extends CodedApplicationError {
  constructor(message: string = `Unexpected contact state`) {
    super(ApplicationErrorCode.UNEXPECTED_CONTACT_STATE, message);
    this.name = 'UnexpectedContactStateError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnexpectedContactStateError);
    }
  }
}
