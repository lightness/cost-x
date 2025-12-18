import { Injectable, Scope } from '@nestjs/common';
import { PaymentsFilter } from '../dto';
import Payment from '../entities/payment.entity';
import { PaymentService } from '../payment.service';
import { FilteredPaymentsLoader } from './filtered-payments.loader.service';

@Injectable({ scope: Scope.REQUEST })
export class PaymentsByItemIdLoader extends FilteredPaymentsLoader<number, Payment[]> {
  constructor(private paymentService: PaymentService) {
    super();
  }

  protected async loaderWithOptionsFn(itemIds: number[], filter: PaymentsFilter): Promise<Payment[][]> {
    const paymentsByItemId = await this.paymentService.getPaymentsByItemIds(itemIds, filter);

    return itemIds.map(itemId => paymentsByItemId.get(itemId) || []);
  }
}