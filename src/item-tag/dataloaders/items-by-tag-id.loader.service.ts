import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Item, ItemTag } from '../../database/entities';
import { BaseLoader } from '../../graphql/dataloaders/base.loader';

@Injectable({ scope: Scope.REQUEST })
export class ItemsByTagIdLoader extends BaseLoader<number, Item[]> {
  constructor(@InjectRepository(ItemTag) private itemTagRepository: Repository<ItemTag>) {
    super();
  }

  protected async loaderFn(tagIds: number[]): Promise<Item[][]> {
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
  }
}
