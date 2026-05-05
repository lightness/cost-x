import { HttpStatus } from '@nestjs/common';
import { format } from 'node:util';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.NOT_FOUND)
export class WorkspaceMemberNotBelongingToWorkspaceError extends CodedApplicationError {
  constructor(
    workspaceMemberIds: number[] | number,
    message: string = 'Workspace member %j not belonging to workspace',
  ) {
    super(
      ApplicationErrorCode.WORKSPACE_MEMBER_NOT_BELONGING_TO_WORKSPACE,
      format(message, workspaceMemberIds),
    );
    this.name = 'WorkspaceMemberNotBelongingToWorkspaceError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceMemberNotBelongingToWorkspaceError);
    }
  }
}
