import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsistencyModule } from '../consistency/consistency.module';
import { Item, Payment } from '../database/entities';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentsByItemIdLoaderService } from './dataloaders/payments-by-item-id.loader.service';
import { FindPaymentsAggregatesResolver } from './find-payments-aggregates.resolver';
import { FindPaymentsResponseResolver } from './find-payments-response.resolver';
import { PaymentController } from './payment.controller';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';

@Module({ 
  imports: [
    ConsistencyModule, 
    ItemCostModule, 
    TypeOrmModule.forFeature([Payment, Item])],
  providers: [
    PaymentService,
    // dataloaders
    PaymentsByItemIdLoaderService,
    // resolvers
    PaymentResolver,
    FindPaymentsAggregatesResolver,
    FindPaymentsResponseResolver,
  ],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}