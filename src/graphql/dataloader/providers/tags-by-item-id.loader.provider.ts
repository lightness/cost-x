import { Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { ItemTag, Tag } from '../../../database/entities';
import { Loader } from '../interfaces';

export const tagsByItemIdLoaderProvider: Provider = {
  provide: Loader.TAGS_BY_ITEM_ID,
  useFactory(itemTagRepository: Repository<ItemTag>) {
    return new DataLoader<number, Tag[]>(async (itemIds: number[]) => {

      const itemTags = await itemTagRepository.find({
        where: { itemId: In(itemIds) },
        relations: { tag: true },
      });

      const tagsByItemId = itemIds.map(itemId =>
        itemTags
          .filter(itemTag => itemTag.itemId === itemId)
          .map(itemTag => itemTag.tag)
      );

      return tagsByItemId;
    });
  },
  inject: [getRepositoryToken(ItemTag)],
}
