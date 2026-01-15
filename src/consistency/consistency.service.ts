import { Injectable } from '@nestjs/common';
import type Item from '../item/entities/item.entity';
import type Payment from '../payment/entities/payment.entity';
import type { User } from '../user/entities/user.entity';
import type { Workspace } from '../workspace/entity/workspace.entity';
import { Relation } from './relation';

@Injectable()
export class ConsistencyService {
  paymentToItem = new Relation<Payment, Item>(
    (payment) => payment.itemId,
    (item) => item.id,
    (payment, item) =>
      `Payment #${payment.id} does not belong to item #${item.id}`,
  );

  workspaceToUser = new Relation<Workspace, User>(
    (workspace) => workspace.ownerId,
    (user) => user.id,
    (workspace, user) =>
      `Workspace #${workspace.id} does not belong to user #${user.id}`,
  );
}
