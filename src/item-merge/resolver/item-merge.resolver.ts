import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ItemByIdPipe } from '../../common/pipes/item-by-id.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entities/item.entity';
import { MergeItemsInDto } from '../dto';
import { ItemMergeService } from '../item-merge.service';

@Resolver()
export class ItemMergeResolver {
  constructor(private itemMergeService: ItemMergeService) {}

  @Mutation(() => Item)
  async mergeItems(
    @Args('dto') _: MergeItemsInDto,
    @DeepArgs('dto.hostItemId', ItemByIdPipe) hostItem: Item,
    @DeepArgs('dto.mergingItemId', ItemByIdPipe) mergingItem: Item,
  ) {
    return this.itemMergeService.merge(hostItem, mergingItem);
  }
}
