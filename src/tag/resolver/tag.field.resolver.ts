import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { Workspace } from '../../workspace/entity/workspace.entity';
import Tag from '../entity/tag.entity';

@Resolver(() => Tag)
export class TagFieldResolver {
  constructor(private prisma: PrismaService) {}

  @ResolveField(() => Workspace)
  async workspace(@Parent() tag: Tag) {
    return this.prisma.workspace.findUnique({ where: { id: tag.workspaceId } });
  }
}
