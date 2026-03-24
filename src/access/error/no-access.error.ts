import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.FORBIDDEN)
export class NoAccessError extends CodedApplicationError {
  constructor(message: string = `No access`) {
    super(ApplicationErrorCode.NO_ACCESS, message);
    this.name = 'NoAccessError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoAccessError);
    }
  }
}
