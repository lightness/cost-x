import { Module } from '@nestjs/common';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { ItemModule } from '../item/item.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SpreadsheetModule } from '../spreadsheet/spreadsheet.module';
import { TagModule } from '../tag/tag.module';
import { UserModule } from '../user/user.module';
import { WorkspaceMembershipModule } from '../workspace-membership/workspace-membership.module';
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
    PrismaModule,
    WorkspaceMembershipModule,
  ],
  providers: [DataMigrationService, InquirerService],
})
export class DataMigrationModule {}
