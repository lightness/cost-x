import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { GroupModule } from '../group/group.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemByIdLoader } from './dataloader/item-by-id.loader.service';
import { ItemsByWorkspaceIdLoader } from './dataloader/items-by-workspace-id.loader.service';
import { WorkspaceByItemIdLoader } from './dataloader/workspace-by-item-id.loader.service';
import { ItemService } from './item.service';
import { ItemFieldResolver } from './resolver/item.field.resolver';
import { ItemMutationResolver } from './resolver/item.mutation.resolver';
import { ItemQueryResolver } from './resolver/item.query.resolver';
import { PaymentItemFieldResolver } from './resolver/payment-item.field.resolver';
import { WorkspaceItemsFieldResolver } from './resolver/workspace-items.field.resolver';

@Module({
  exports: [ItemService, ItemsByWorkspaceIdLoader, ItemByIdLoader],
  imports: [
    AuthModule,
    AccessModule,
    PrismaModule,
    ItemCostModule,
    PaymentModule,
    CurrencyRateModule,
    GroupModule,
  ],
  providers: [
    // service
    ItemService,
    // resolvers
    ItemFieldResolver,
    ItemQueryResolver,
    ItemMutationResolver,
    PaymentItemFieldResolver,
    WorkspaceItemsFieldResolver,
    // dataloader
    ItemsByWorkspaceIdLoader,
    ItemByIdLoader,
    WorkspaceByItemIdLoader,
  ],
})
export class ItemModule {}
