import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class ExtractAllPaymentsError extends CodedApplicationError {
  constructor(message: string = 'Payment IDs must not contain all payments from the item') {
    super(ApplicationErrorCode.EXTRACT_ALL_PAYMENTS, message);
    this.name = 'ExtractAllPaymentsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExtractAllPaymentsError);
    }
  }
}
