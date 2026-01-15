import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import type { PaymentsFilter } from '../dto';
import type Payment from '../entities/payment.entity';
import type { PaymentService } from '../payment.service';

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
