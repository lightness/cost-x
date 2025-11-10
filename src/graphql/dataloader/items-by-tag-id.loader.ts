import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { In, Repository } from 'typeorm';
import { Item, ItemTag } from '../../database/entities';

@Injectable()
export class ItemsByTagIdLoader {
  constructor(@InjectRepository(ItemTag) private itemTagRepository: Repository<ItemTag>) {}

  public createLoader() {
    return new DataLoader<number, Item[]>(async (tagIds: number[]) => {

      const itemTags = await this.itemTagRepository.find({
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
  }
}