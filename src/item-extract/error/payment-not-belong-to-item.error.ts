import { HttpStatus } from '@nestjs/common';
import { HttpErrorCode } from '../../common/decorator/http-error-code.decorator';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from '../../common/error/coded-application.error';

@HttpErrorCode(HttpStatus.BAD_REQUEST)
export class PaymentNotBelongToItemError extends CodedApplicationError {
  constructor(paymentIds: number[]) {
    super(
      ApplicationErrorCode.PAYMENT_NOT_BELONG_TO_ITEM,
      `Payments [${paymentIds.join(', ')}] do not belong to the item`,
    );
    this.name = 'PaymentNotBelongToItemError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentNotBelongToItemError);
    }
  }
}
