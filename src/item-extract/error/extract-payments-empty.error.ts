import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class ExtractPaymentsEmptyError extends CodedApplicationError {
  constructor(message: string = 'Payment IDs must not be empty') {
    super(ApplicationErrorCode.EXTRACT_PAYMENTS_EMPTY, message);
    this.name = 'ExtractPaymentsEmptyError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExtractPaymentsEmptyError);
    }
  }
}
