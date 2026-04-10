import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class WorkspaceInviteAlreadyExistsError extends CodedApplicationError {
  constructor(message = 'Pending workspace invite already exists for this user') {
    super(ApplicationErrorCode.WORKSPACE_INVITE_ALREADY_EXISTS, message);
    this.name = 'WorkspaceInviteAlreadyExistsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceInviteAlreadyExistsError);
    }
  }
}
