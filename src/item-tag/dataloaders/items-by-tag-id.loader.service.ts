import { Injectable, Scope } from '@nestjs/common';
import Item from '../../item/entities/item.entity';
import { NestedLoader } from '../../graphql/dataloaders/nested.loader';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { ItemTagService } from '../item-tag.service';
import { GroupService } from '../../group/group.service';

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
