import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { GroupModule } from '../group/group.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsByWorkspaceIdLoader } from './dataloader/items-by-workspace-id.loader.service';
import { ItemService } from './item.service';
import { ItemResolver } from './resolver/item.resolver';

@Module({
  exports: [ItemService, ItemsByWorkspaceIdLoader],
  imports: [
    AuthModule,
    AccessModule,
    PrismaModule,
    ItemTagModule,
    ItemCostModule,
    PaymentModule,
    CurrencyRateModule,
    GroupModule,
  ],
  providers: [
    // service
    ItemService,
    // resolvers
    ItemResolver,
    ItemsByWorkspaceIdLoader,
  ],
})
export class ItemModule {}
