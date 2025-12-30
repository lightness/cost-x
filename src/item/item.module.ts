import { Module } from '@nestjs/common';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { PaymentModule } from '../payment/payment.module';
import { ItemController } from './item.controller';
import { ItemResolver } from './resolvers/item.resolver';
import { ItemService } from './item.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ItemTagModule,
    ItemCostModule,
    PaymentModule, 
    CurrencyRateModule,
  ],
  providers: [
    // service
    ItemService,
    // resolvers
    ItemResolver,
  ],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}