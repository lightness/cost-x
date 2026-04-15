import {
  Injectable,
  NotFoundException,
  type PipeTransform,
} from '@nestjs/common';
import Item from '../../item/entity/item.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';

@Injectable()
export class WorkspaceByItemPipe
  implements PipeTransform<Item, Promise<Workspace>>
{
  constructor(private prisma: PrismaService) {}

  async transform(item: Item): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: item.workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace #${item.workspaceId} not found`);
    }

    return workspace;
  }
}
