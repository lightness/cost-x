import { HttpStatus } from '@nestjs/common';
import { format } from 'node:util';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class WorkspaceMemberStakeDuplicatedError extends CodedApplicationError {
  constructor(
    workspaceMemberIds: number[],
    message: string = 'Workspace member(s) stake duplicated. Member ids: %j',
  ) {
    super(
      ApplicationErrorCode.WORKSPACE_MEMBER_STAKE_DUPLICATED,
      format(message, workspaceMemberIds),
    );
    this.name = 'WorkspaceMemberStakeDuplicatedError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceMemberStakeDuplicatedError);
    }
  }
}
