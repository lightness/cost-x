import { HttpStatus } from '@nestjs/common';
import { format } from 'node:util';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class WorkspaceMemberStakeHasNegativeValueError extends CodedApplicationError {
  constructor(
    workspaceMemberIds: number[],
    message: string = 'Workspace member(s) stake has negative value. Member ids: %j',
  ) {
    super(
      ApplicationErrorCode.WORKSPACE_MEMBER_STAKE_HAS_NEGATIVE_VALUE,
      format(message, workspaceMemberIds),
    );
    this.name = 'WorkspaceMemberStakeHasNegativeValueError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceMemberStakeHasNegativeValueError);
    }
  }
}
