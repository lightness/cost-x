import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import PaymentBalanceChange from '../entity/payment-balance-change.entity';

@Injectable({ scope: Scope.REQUEST })
export class PaymentBalanceChangesByPaymentIdLoader extends BaseLoader<
  number,
  PaymentBalanceChange[]
> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(paymentIds: number[]): Promise<PaymentBalanceChange[][]> {
    const changes = await this.prisma.paymentBalanceChange.findMany({
      where: { paymentId: { in: paymentIds } },
    });

    const changesByPaymentId = this.groupService.groupBy(changes, 'paymentId');

    return paymentIds.map((paymentId) => changesByPaymentId.get(paymentId) || []);
  }
}
