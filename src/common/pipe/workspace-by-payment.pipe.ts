import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import Payment from '../../payment/entity/payment.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';

@Injectable()
export class WorkspaceByPaymentPipe implements PipeTransform<Payment, Promise<Workspace>> {
  constructor(private prisma: PrismaService) {}

  async transform(payment: Payment): Promise<Workspace> {
    const item = await this.prisma.item.findUnique({ where: { id: payment.itemId } });

    if (!item) {
      throw new NotFoundException(`Item #${payment.itemId} not found`);
    }

    const workspace = await this.prisma.workspace.findUnique({ where: { id: item.workspaceId } });

    if (!workspace) {
      throw new NotFoundException(`Workspace #${item.workspaceId} not found`);
    }

    return workspace;
  }
}
