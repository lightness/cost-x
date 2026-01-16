import { Module } from '@nestjs/common';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { ItemModule } from '../item/item.module';
import { PaymentModule } from '../payment/payment.module';
import { SpreadsheetModule } from '../spreadsheet/spreadsheet.module';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { DataMigrationService } from './data-migration.service';
import { InquirerService } from './inquirer.service';

@Module({
  imports: [
    SpreadsheetModule,
    ItemModule,
    ItemTagModule,
    TagModule,
    PaymentModule,
    UserModule,
    WorkspaceModule,
  ],
  providers: [
    DataMigrationService, 
    InquirerService,
  ],
})
export class DataMigrationModule {}
