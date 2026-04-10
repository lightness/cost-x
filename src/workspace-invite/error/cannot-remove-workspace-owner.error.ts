import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class CannotRemoveWorkspaceOwnerError extends CodedApplicationError {
  constructor(message = 'Cannot remove the workspace owner from the workspace') {
    super(ApplicationErrorCode.CANNOT_REMOVE_WORKSPACE_OWNER, message);
    this.name = 'CannotRemoveWorkspaceOwnerError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CannotRemoveWorkspaceOwnerError);
    }
  }
}
