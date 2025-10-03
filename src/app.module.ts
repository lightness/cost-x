import config from './app.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TagModule } from './tag/tag.module';
import { DatabaseModule } from './database/database.module';
import { ItemModule } from './item/item.module';
import { ItemTagModule } from './item-tag/item-tag.module';
import { PaymentModule } from './payment/payment.module';
import { CurrencyRateModule } from './currency-rate/currency-rate.module';
import { SpreadsheetModule } from './spreadsheet/spreadsheet.module';
import { DataMigrationService } from './data-migration/data-migration.service';
import { DataMigrationModule } from './data-migration/data-migration.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    DatabaseModule,
    TagModule,
    ItemModule,
    ItemTagModule,
    PaymentModule,
    CurrencyRateModule,
    DataMigrationModule,
  ],
})
export class AppModule {}