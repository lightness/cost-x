import { HttpStatus } from '@nestjs/common';
import { format } from 'node:util';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class NonPositiveSumOfStakeValuesError extends CodedApplicationError {
  constructor(
    sumOfStakeValues: number,
    message: string = 'Sum of stake values is non-positive: %j',
  ) {
    super(ApplicationErrorCode.NON_POSITIVE_SUM_OF_STAKE_VALUES, format(message, sumOfStakeValues));
    this.name = 'NonPositiveSumOfStakeValuesError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NonPositiveSumOfStakeValuesError);
    }
  }
}
