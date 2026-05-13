import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../generated/prisma/client';
import Payment from '../../src/payment/entity/payment.entity';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WorkspaceMember } from '../../src/workspace-membership/entity/workspace-member.entity';

interface CreatePaymentOverrides {
  title: string;
  cost: Decimal;
  currency: Currency;
  date: Date;
  payerId?: number;
}

@Injectable()
export class PaymentFactoryService {
  constructor(private prisma: PrismaService) {}

  async create(itemId: number, overrides: Partial<CreatePaymentOverrides> = {}): Promise<Payment> {
    const payerId = overrides?.payerId || (await this.findOrCreateWorkspaceOwnerMember(itemId)).id;

    return this.prisma.payment.create({
      data: {
        cost: overrides.cost ?? new Decimal('10.00'),
        currency: overrides.currency ?? Currency.USD,
        date: overrides.date ?? new Date('2024-01-01'),
        itemId,
        payerId,
        title: overrides.title,
      },
    });
  }

  private async findOrCreateWorkspaceOwnerMember(itemId: number): Promise<WorkspaceMember> {
    const { workspace } = await this.prisma.item.findUnique({
      select: {
        workspace: true,
      },
      where: { id: itemId },
    });

    const ownerMember = await this.prisma.workspaceMember.upsert({
      create: {
        userId: workspace.ownerId,
        workspaceId: workspace.id,
      },
      update: {},
      where: {
        workspaceId_userId: {
          userId: workspace.ownerId,
          workspaceId: workspace.id,
        },
      },
    });

    return ownerMember;
  }
}
