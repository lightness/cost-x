import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../generated/prisma/enums';
import { ItemTagService } from '../item-tag/item-tag.service';
import { ItemService } from '../item/item.service';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { SpreadsheetService } from '../spreadsheet/spreadsheet.service';
import Tag from '../tag/entity/tag.entity';
import { TagService } from '../tag/tag.service';
import { UserService } from '../user/user.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { InquirerService } from './inquirer.service';

@Injectable()
export class DataMigrationService {
  private readonly logger = new Logger(DataMigrationService.name);

  constructor(
    private spreadsheetService: SpreadsheetService,
    private tagService: TagService,
    private itemService: ItemService,
    private itemTagService: ItemTagService,
    private paymentService: PaymentService,
    private userService: UserService,
    private workspaceService: WorkspaceService,
    private inquirerService: InquirerService,
    private prisma: PrismaService,
  ) {}

  async migrate() {
    const rows = await this.spreadsheetService.loadEverything();

    const credentials = await this.inquirerService.askForCredentials();

    return this.prisma.$transaction(async (tx) => {
      const user = await this.userService.create(
        {
          email: credentials.email.toLowerCase(),
          name: credentials.name,
          password: credentials.password,
        },
        tx,
      );

      const defaultCurrency = await this.inquirerService.askForDefaultCurrency();

      const workspace = await this.workspaceService.create(
        {
          defaultCurrency,
          title: `Imported workspace ${new Date().toISOString()}`,
        },
        user,
        tx,
      );

      let globalTag: Tag;

      for (const row of rows) {
        const { title, usdCost, eurCost, bynCost, date } = row;

        if (title && !date && !usdCost && !eurCost && !bynCost) {
          const cleanTitle = title.trim();

          globalTag = await this.tagService.create(
            workspace.id,
            {
              title: cleanTitle,
            },
            user,
            tx,
          );

          continue;
        }

        const item = await this.itemService.create(workspace.id, { title }, user, tx);

        if (globalTag) {
          await this.itemTagService.assignTag(item, globalTag, user, tx);
        }

        if (usdCost) {
          await this.paymentService.createPayment(
            item,
            {
              cost: new Decimal(usdCost),
              currency: Currency.USD,
              date: new Date(date),
            },
            user,
            tx,
          );
        }

        if (eurCost) {
          await this.paymentService.createPayment(
            item,
            {
              cost: new Decimal(eurCost),
              currency: Currency.EUR,
              date: new Date(date),
            },
            user,
            tx,
          );
        }

        if (bynCost) {
          await this.paymentService.createPayment(
            item,
            {
              cost: new Decimal(bynCost),
              currency: Currency.BYN,
              date: new Date(date),
            },
            user,
            tx,
          );
        }
      }

      this.logger.log('Done');
    });
  }
}
