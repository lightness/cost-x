import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { ItemTag, Tag } from '../../database/entities';
import { IDataloaderService, LoaderName } from '../../graphql/dataloaders/interfaces';

@Injectable()
export class TagsByItemIdLoaderService implements IDataloaderService<number, Tag[]> {
  constructor(@InjectRepository(ItemTag) private itemTagRepository: Repository<ItemTag>) {}
  
  get loaderName(): LoaderName {
    return LoaderName.TAGS_BY_ITEM_ID;
  }

  createDataloader(): DataLoader<number, Tag[], number> {
    return new DataLoader<number, Tag[]>(async (itemIds: number[]) => {

      const itemTags = await this.itemTagRepository.find({
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
  }
}
