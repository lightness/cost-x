import { Injectable, Scope } from '@nestjs/common';
import { NestedLoader } from '../../graphql/dataloader/nested.loader';
import { GroupService } from '../../group/group.service';
import { ItemsFilter } from '../../item/dto';
import Item from '../../item/entity/item.entity';
import { PaymentsFilter } from '../../payment/dto';
import { ItemTagService } from '../item-tag.service';

interface Filter {
  itemsFilter: ItemsFilter;
  paymentsFilter: PaymentsFilter;
}

@Injectable({ scope: Scope.REQUEST })
export class ItemsByTagIdLoader extends NestedLoader<number, Item[], Filter> {
  constructor(
    private itemTagService: ItemTagService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderWithOptionsFn(
    tagIds: number[],
    filter: Filter,
  ): Promise<Item[][]> {
    const itemTags = await this.itemTagService.findByTagIds(
      tagIds,
      filter.itemsFilter,
      filter.paymentsFilter,
    );

    const itemsByTagId = this.groupService.groupBy(itemTags, 'tagId');

    return tagIds.map((tagId) =>
      (itemsByTagId.get(tagId) || []).map((itemTag) => itemTag.item),
    );
  }
}
