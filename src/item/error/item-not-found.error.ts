import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class ItemNotFoundError extends CodedApplicationError {
  constructor(message: string = `Item not found`) {
    super(ApplicationErrorCode.ITEM_NOT_FOUND, message);
    this.name = 'ItemNotFoundError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ItemNotFoundError);
    }
  }
}
