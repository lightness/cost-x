import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class SelfBlockForbiddenError extends CodedApplicationError {
  constructor(message: string = `Self-block is forbidden`) {
    super(ApplicationErrorCode.SELF_BLOCK_FORBIDDEN, message);
    this.name = 'SelfBlockForbiddenError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelfBlockForbiddenError);
    }
  }
}
