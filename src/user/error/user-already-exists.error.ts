import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class UserAlreadyExistsError extends CodedApplicationError {
  constructor(message: string = `User already exists`) {
    super(ApplicationErrorCode.USER_ALREADY_EXISTS, message);
    this.name = 'UserAlreadyExistsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserAlreadyExistsError);
    }
  }
}
