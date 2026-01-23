import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import Item from '../../item/entities/item.entity';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../../tag/entities/tag.entity';
import { UserRole } from '../../user/entities/user-role.enum';
import { AssignTagInDto, UnassignTagInDto } from '../dto';
import ItemTag from '../entities/item-tag.entity';
import { ItemTagService } from '../item-tag.service';
import { fromArg } from '../../access/function/from-arg.function';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import { ItemByIdPipe } from '../../common/pipes/item-by-id.pipe';
import { TagByIdPipe } from '../../common/pipes/tag-by-id.pipe';

@Resolver(() => ItemTag)
@UseGuards(AuthGuard, AccessGuard)
export class ItemTagResolver {
  constructor(
    private prisma: PrismaService,
    private itemTagService: ItemTagService,
  ) {}

  @ResolveField(() => Item)
  async item(
    @Parent() itemTag: ItemTag,
  ) {
    return this.prisma.item.findUnique({ where: { id: itemTag.itemId } });
  }

  @ResolveField(() => Tag)
  async tag(
    @Parent() itemTag: ItemTag,
  ) {
    return this.prisma.tag.findUnique({ where: { id: itemTag.tagId } });
  }

  @Mutation(() => ItemTag)
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
    {
      and: [
        { targetScope: AccessScope.ITEM, targetId: fromArg('dto.itemId'), role: [UserRole.USER] },
        { targetScope: AccessScope.TAG, targetId: fromArg('dto.tagId'), role: [UserRole.USER] },
      ],
    },
  ])
  async assignTag(
    @Args('dto') _: AssignTagInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) item: Item,
    @DeepArgs('dto.tagId', TagByIdPipe) tag: Tag,
  ) {
    return this.itemTagService.assignTag(item, tag);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
    {
      and: [
        { targetScope: AccessScope.ITEM, targetId: fromArg('dto.itemId'), role: [UserRole.USER] },
        { targetScope: AccessScope.TAG, targetId: fromArg('dto.tagId'), role: [UserRole.USER] },
      ],
    },
  ])
  async unassignTag(
    @Args('dto') _: UnassignTagInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) item: Item,
    @DeepArgs('dto.tagId', TagByIdPipe) tag: Tag,
  ) {
    await this.itemTagService.unassignTag(item, tag);

    return true;
  }
}
