import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class WorkspaceInviteAlreadyExistsError extends CodedApplicationError {
  constructor(message: string = 'Workspace invite already exists') {
    super(ApplicationErrorCode.WORKSPACE_INVITE_ALREADY_EXISTS, message);
    this.name = 'WorkspaceInviteAlreadyExistsError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceInviteAlreadyExistsError);
    }
  }
}
