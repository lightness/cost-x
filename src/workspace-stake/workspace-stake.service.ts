import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { PaymentBalanceService } from '../payment-balance/payment-balance.service';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { Workspace } from '../workspace/entity/workspace.entity';
import { BalanceCurrencyMode } from './entity/balance-currency-mode.enum';
import { StakeRule } from './entity/stake-rule.enum';

@Injectable()
export class WorkspaceStakeService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private paymentBalanceService: PaymentBalanceService,
  ) {}

  async updateWorkspaceStakeRule(
    workspace: Workspace,
    stakeRule: StakeRule,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    const updatedWorkspace = await tx.workspace.update({
      data: { stakeRule },
      where: { id: workspace.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_UPDATED, {
      actorId: currentUser.id,
      newWorkspace: updatedWorkspace,
      oldWorkspace: workspace,
      tx,
    });

    return updatedWorkspace;
  }

  async updateWorkspaceBalanceCurrencyMode(
    workspace: Workspace,
    mode: BalanceCurrencyMode,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    const updatedWorkspace = await tx.workspace.update({
      data: { balanceCurrencyMode: mode },
      where: { id: workspace.id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_UPDATED, {
      actorId: currentUser.id,
      newWorkspace: updatedWorkspace,
      oldWorkspace: workspace,
      tx,
    });

    await this.paymentBalanceService.syncWorkspaceBalance(workspace.id, tx);

    return updatedWorkspace;
  }
}
