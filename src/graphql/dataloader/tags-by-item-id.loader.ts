import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { ItemTag, Tag } from '../../database/entities';

@Injectable()
export class TagsByItemIdLoader {
  constructor(@InjectRepository(ItemTag) private itemTagRepository: Repository<ItemTag>) {}

  public createLoader() {
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