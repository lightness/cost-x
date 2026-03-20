import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

export class SelfBlockForbiddenError extends CodedApplicationError {
  constructor(message: string = `Self-block is forbidden`) {
    super(ApplicationErrorCode.SELF_BLOCK_FORBIDDEN, message);
    this.name = 'SelfBlockForbiddenError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SelfBlockForbiddenError);
    }
  }
}
