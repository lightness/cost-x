import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.FORBIDDEN)
export class InsufficientActorPermissionsError extends CodedApplicationError {
  constructor(message: string = 'Actor does not hold all requested permissions') {
    super(ApplicationErrorCode.INSUFFICIENT_ACTOR_PERMISSIONS, message);
    this.name = 'InsufficientActorPermissionsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsufficientActorPermissionsError);
    }
  }
}
