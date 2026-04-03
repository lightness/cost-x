import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { TagByIdPipe } from '../../common/pipe/tag-by-id.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entity/item.entity';
import Tag from '../../tag/entity/tag.entity';
import { UserRole } from '../../user/entity/user-role.enum';
import { AssignTagInDto, UnassignTagInDto } from '../dto';
import ItemTag from '../entity/item-tag.entity';
import { ItemTagService } from '../item-tag.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemTagMutationResolver {
  constructor(private itemTagService: ItemTagService) {}

  @Mutation(() => ItemTag)
  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      and: [
        {
          role: [UserRole.USER],
          targetId: fromArg('dto.itemId'),
          targetScope: AccessScope.ITEM,
        },
        {
          role: [UserRole.USER],
          targetId: fromArg('dto.tagId'),
          targetScope: AccessScope.TAG,
        },
      ],
    },
  ])
  async assignTag(
    @Args('dto') _: AssignTagInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) item: Item,
    @DeepArgs('dto.tagId', TagByIdPipe) tag: Tag,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemTagService.assignTag(item, tag, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      and: [
        {
          role: [UserRole.USER],
          targetId: fromArg('dto.itemId'),
          targetScope: AccessScope.ITEM,
        },
        {
          role: [UserRole.USER],
          targetId: fromArg('dto.tagId'),
          targetScope: AccessScope.TAG,
        },
      ],
    },
  ])
  async unassignTag(
    @Args('dto') _: UnassignTagInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) item: Item,
    @DeepArgs('dto.tagId', TagByIdPipe) tag: Tag,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.itemTagService.unassignTag(item, tag, tx);

    return true;
  }
}
