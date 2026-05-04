import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class ImproperWorkspaceInviteStatusError extends CodedApplicationError {
  constructor(message: string = 'Improper workspace invite status') {
    super(ApplicationErrorCode.IMPROPER_WORKSPACE_INVITE_STATUS, message);
    this.name = 'ImproperWorkspaceInviteStatusError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImproperWorkspaceInviteStatusError);
    }
  }
}
