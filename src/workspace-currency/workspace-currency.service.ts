import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { Currency } from '../currency-rate/entity/currency.enum';
import { PaymentBalanceService } from '../payment-balance/payment-balance.service';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { BalanceCurrencyMode } from '../workspace-stake/entity/balance-currency-mode.enum';
import { Workspace } from '../workspace/entity/workspace.entity';

@Injectable()
export class WorkspaceCurrencyService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private paymentBalanceService: PaymentBalanceService,
  ) {}

  async updateDefaultCurrency(
    workspace: Workspace,
    defaultCurrency: Currency,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    const updatedWorkspace = await tx.workspace.update({
      data: { defaultCurrency },
      where: { id: workspace.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_UPDATED, {
      actorId: currentUser.id,
      newWorkspace: updatedWorkspace,
      oldWorkspace: workspace,
      tx,
    });

    if (
      workspace.balanceCurrencyMode === BalanceCurrencyMode.DEFAULT_CURRENCY &&
      defaultCurrency !== workspace.defaultCurrency
    ) {
      await this.paymentBalanceService.syncWorkspaceBalance(workspace.id, tx);
    }

    return updatedWorkspace;
  }
}
