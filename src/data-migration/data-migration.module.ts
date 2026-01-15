import { Module } from '@nestjs/common';
import { SpreadsheetModule } from '../spreadsheet/spreadsheet.module';
import { DataMigrationService } from './data-migration.service';
import { ItemModule } from '../item/item.module';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { TagModule } from '../tag/tag.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    SpreadsheetModule,
    ItemModule,
    ItemTagModule,
    TagModule,
    PaymentModule,
  ],
  providers: [DataMigrationService],
})
export class DataMigrationModule {}
