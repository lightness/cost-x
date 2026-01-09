import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AccessGuard } from './access/guard/access.guard';
import config from './app.config';
import { AuthGuard } from './auth/guard/auth.guard';
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
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    GraphqlModule,
    AuthModule,
    AccessModule,
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
    WorkspaceModule,
  ],
})
export class AppModule { }