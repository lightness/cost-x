import { UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entity/item.entity';
import { MergeItemsInDto } from '../dto';
import { ItemMergeService } from '../item-merge.service';

@Resolver()
@UseInterceptors(TransactionInterceptor)
export class ItemMergeResolver {
  constructor(private itemMergeService: ItemMergeService) {}

  @Mutation(() => Item)
  async mergeItems(
    @Args('dto') _: MergeItemsInDto,
    @DeepArgs('dto.hostItemId', ItemByIdPipe) hostItem: Item,
    @DeepArgs('dto.mergingItemId', ItemByIdPipe) mergingItem: Item,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemMergeService.merge(hostItem, mergingItem, tx);
  }
}
