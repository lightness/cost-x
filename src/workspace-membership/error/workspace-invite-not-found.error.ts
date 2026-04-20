import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class WorkspaceInviteNotFoundError extends CodedApplicationError {
  constructor(message: string = 'Workspace invite not found') {
    super(ApplicationErrorCode.WORKSPACE_INVITE_NOT_FOUND, message);
    this.name = 'WorkspaceInviteNotFoundError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceInviteNotFoundError);
    }
  }
}
