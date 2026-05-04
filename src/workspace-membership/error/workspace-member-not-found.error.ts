import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.NOT_FOUND)
export class WorkspaceMemberNotFoundError extends CodedApplicationError {
  constructor(message: string = 'Workspace member not found') {
    super(ApplicationErrorCode.WORKSPACE_MEMBER_NOT_FOUND, message);
    this.name = 'WorkspaceMemberNotFoundError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceMemberNotFoundError);
    }
  }
}
