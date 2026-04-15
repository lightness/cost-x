import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class UserAlreadyWorkspaceMemberError extends CodedApplicationError {
  constructor(message: string = 'User is already a workspace member') {
    super(ApplicationErrorCode.USER_ALREADY_WORKSPACE_MEMBER, message);
    this.name = 'UserAlreadyWorkspaceMemberError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserAlreadyWorkspaceMemberError);
    }
  }
}
