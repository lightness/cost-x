import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.FORBIDDEN)
export class InsufficientInviterPermissionsError extends CodedApplicationError {
  constructor(message: string = 'Inviter does not hold all requested permissions') {
    super(ApplicationErrorCode.INSUFFICIENT_INVITER_PERMISSIONS, message);
    this.name = 'InsufficientInviterPermissionsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsufficientInviterPermissionsError);
    }
  }
}
