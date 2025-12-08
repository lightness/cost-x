import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ItemTag, Tag } from '../../database/entities';
import { BaseLoader } from '../../graphql/dataloaders/base.loader';

@Injectable({ scope: Scope.REQUEST })
export class TagsByItemIdLoader extends BaseLoader<number, Tag[]> {
  constructor(@InjectRepository(ItemTag) private itemTagRepository: Repository<ItemTag>) {
    super();
  }

  protected async loaderFn(itemIds: number[]): Promise<Tag[][]> {
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
  }
}
