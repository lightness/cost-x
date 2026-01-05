import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './app.config';
import { CurrencyRateModule } from './currency-rate/currency-rate.module';
import { DataMigrationModule } from './data-migration/data-migration.module';
import { GraphqlModule } from './graphql/graphql.module';
import { ItemMergeModule } from './item-merge/item-merge.module';
import { ItemTagModule } from './item-tag/item-tag.module';
import { ItemModule } from './item/item.module';
import { ItemsAggregationModule } from './items-aggregation/items-aggregation.module';
import { PaymentModule } from './payment/payment.module';
import { PaymentsAggregationModule } from './payments-aggregation/payments-aggregation.module';
import { TagModule } from './tag/tag.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    GraphqlModule,
    TagModule,
    ItemModule,
    ItemTagModule,
    ItemMergeModule,
    PaymentModule,
    CurrencyRateModule,
    DataMigrationModule,
    PaymentsAggregationModule,
    ItemsAggregationModule,
    UserModule,
  ],
})
export class AppModule { }