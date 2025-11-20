import { Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Item, ItemTag } from '../../../database/entities';
import { Loader } from '../interfaces';

export const itemsByTagIdLoaderProvider: Provider = {
  provide: Loader.ITEMS_BY_TAG_ID,
  useFactory(itemTagRepository: Repository<ItemTag>) {
    return new DataLoader<number, Item[]>(async (tagIds: number[]) => {

      const itemTags = await itemTagRepository.find({
        where: { tagId: In(tagIds) },
        relations: { item: true },
      });

      const itemsByTagId = tagIds.map(tagId =>
        itemTags
          .filter(itemTag => itemTag.tagId === tagId)
          .map(itemTag => itemTag.item)
      );

      return itemsByTagId;
    });
  },
  inject: [getRepositoryToken(ItemTag)],
}
