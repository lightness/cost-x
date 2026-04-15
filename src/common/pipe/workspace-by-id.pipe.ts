import {
  Injectable,
  NotFoundException,
  type PipeTransform,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';

@Injectable()
export class WorkspaceByIdPipe implements PipeTransform<number, Promise<Workspace>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findFirst({ where: { id: value } });

    if (!workspace) {
      throw new NotFoundException(`Workspace #${value} not found`);
    }

    return workspace;
  }
}
