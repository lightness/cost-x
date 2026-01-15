import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import { PaymentsFilter } from '../dto';
import Payment from '../entities/payment.entity';
import { PaymentService } from '../payment.service';

@Injectable({ scope: Scope.REQUEST })
export class PaymentsByItemIdLoader extends NestedLoader<
  number,
  Payment[],
  PaymentsFilter
> {
  constructor(private paymentService: PaymentService) {
    super();
  }

  protected async loaderWithOptionsFn(
    itemIds: number[],
    filter: PaymentsFilter,
  ): Promise<Payment[][]> {
    const paymentsByItemId = await this.paymentService.getPaymentsByItemIds(
      itemIds,
      filter,
    );

    return itemIds.map((itemId) => paymentsByItemId.get(itemId) || []);
  }
}
