import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class WorkspaceMemberAlreadyRemovedError extends CodedApplicationError {
  constructor(message: string = 'Workspace member is already removed') {
    super(ApplicationErrorCode.WORKSPACE_MEMBER_ALREADY_REMOVED, message);
    this.name = 'WorkspaceMemberAlreadyRemovedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceMemberAlreadyRemovedError);
    }
  }
}
