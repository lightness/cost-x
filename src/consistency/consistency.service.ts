import { Injectable } from '@nestjs/common';
import Item from '../item/entities/item.entity';
import Payment from '../payment/entities/payment.entity';
import { User } from '../user/entities/user.entity';
import { Workspace } from '../workspace/entity/workspace.entity';
import { Relation } from './relation';
import Tag from '../tag/entities/tag.entity';

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

  itemToWorkspace = new Relation<Item, Workspace>(
    (item) => item.workspaceId,
    (workspace) => workspace.id,
    (item, workspace) => `Item #${item.id} does not belong to workspace #${workspace.id}`,
  );

  tagToWorkspace = new Relation<Tag, Workspace>(
    (tag) => tag.workspaceId,
    (workspace) => workspace.id,
    (tag, workspace) => `Tag #${tag.id} does not belong to workspace #${workspace.id}`,
  );

  itemAndTagToSameWorkspace = new Relation<Item, Tag>(
    (item) => item.workspaceId,
    (tag) => tag.workspaceId,
    (item, tag) => `Item #${item.id} and tag #${tag.id} does not belong to same workspace`,
  );

  itemsToSameWorkspace = new Relation<Item, Item>(
    (item) => item.workspaceId,
    (item) => item.workspaceId,
    (item1, item2) => `Items #${item1.id} and #${item2.id} does not belong to same workspace`,
  )
}
