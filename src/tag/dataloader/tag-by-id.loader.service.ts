import { Injectable, Scope } from '@nestjs/common';
import { unique } from '../../common/function/unique';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../entity/tag.entity';

@Injectable({ scope: Scope.REQUEST })
export class TagByIdLoader extends BaseLoader<number, Tag> {
  constructor(
    private prisma: PrismaService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(tagIds: number[]): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({ where: { id: { in: tagIds.filter(unique) } } });
    const tagsById = this.groupService.mapBy(tags, 'id');

    return tagIds.map((tagId) => tagsById.get(tagId) || null);
  }
}
