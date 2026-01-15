import { Injectable } from '@nestjs/common';
import { SpreadsheetService } from '../spreadsheet/spreadsheet.service';
import { TagService } from '../tag/tag.service';
import { ItemService } from '../item/item.service';
import { ItemTagService } from '../item-tag/item-tag.service';
import { PaymentService } from '../payment/payment.service';
import { Currency } from '../../generated/prisma/enums';
import Tag from '../tag/entities/tag.entity';
import { UserService } from '../user/user.service';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class DataMigrationService {
  constructor(
    private spreadsheetService: SpreadsheetService,
    private tagService: TagService,
    private itemService: ItemService,
    private itemTagService: ItemTagService,
    private paymentService: PaymentService,
    private userService: UserService,
    private workspaceService: WorkspaceService,
  ) {}

  async migrate() {
    const rows = await this.spreadsheetService.loadEverything();

    const user = await this.userService.create({
      email: 'uladzimir.aleshka@gmail.com',
      name: 'Vova',
      password: 'Test12345',
    });

    const workspace = await this.workspaceService.create(
      {
        title: 'Strojka',
      },
      user,
    );

    let globalTag: Tag;

    for (const row of rows) {
      const { title, usdCost, eurCost, bynCost, date } = row;

      if (title && !date && !usdCost && !eurCost && !bynCost) {
        const cleanTitle = title.trim();

        globalTag = await this.tagService.create({ title: cleanTitle });

        continue;
      }

      const item = await this.itemService.create(workspace.id, { title });

      if (globalTag) {
        await this.itemTagService.setTag(item, globalTag);
      }

      if (usdCost) {
        await this.paymentService.addPayment(item, {
          cost: usdCost,
          currency: Currency.USD,
          date: new Date(date),
        });
      }

      if (eurCost) {
        await this.paymentService.addPayment(item, {
          cost: eurCost,
          currency: Currency.EUR,
          date: new Date(date),
        });
      }

      if (bynCost) {
        await this.paymentService.addPayment(item, {
          cost: bynCost,
          currency: Currency.BYN,
          date: new Date(date),
        });
      }
    }
  }
}
