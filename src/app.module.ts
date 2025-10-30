import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './app.config';
import { CurrencyRateModule } from './currency-rate/currency-rate.module';
import { DataMigrationModule } from './data-migration/data-migration.module';
import { DatabaseModule } from './database/database.module';
import { GraphqlModule } from './graphql/graphql.module';
import { ItemMergeModule } from './item-merge/item-merge.module';
import { ItemTagModule } from './item-tag/item-tag.module';
import { ItemModule } from './item/item.module';
import { PaymentModule } from './payment/payment.module';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    DatabaseModule,
    GraphqlModule,
    TagModule,
    ItemModule,
    ItemTagModule,
    ItemMergeModule,
    PaymentModule,
    CurrencyRateModule,
    DataMigrationModule,
  ],
})
export class AppModule { }