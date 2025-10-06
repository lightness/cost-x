import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, Tag } from '../database/entities';

@Injectable()
export class ItemTagService {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
  ) {}

  async setTag(item: Item, tag: Tag): Promise<Item> {
    const itemWithTags = await this.itemRepository.findOne({ 
      where: { id: item.id }, 
      relations: { tags: true },
    });

    const alreadyHasTag = itemWithTags.tags.some(({ id }) => id === tag.id);

    if (alreadyHasTag) {
      throw new BadRequestException(`Item #${item.id} already has tag #${tag.id}`);
    }

    itemWithTags.tags.push(tag);

    return this.itemRepository.save(itemWithTags);
  }

  async removeTag(item: Item, tag: Tag): Promise<Item> {
    const itemWithTags = await this.itemRepository.findOne({ 
      where: { id: item.id }, 
      relations: { tags: true },
    });

    const missingTag = itemWithTags.tags.every(({ id }) => id !== tag.id);

    if (missingTag) {
      throw new BadRequestException(`Item #${item.id} does not have tag #${tag.id}`);
    }

    itemWithTags.tags = itemWithTags.tags.filter(({ id }) => id !== tag.id);

    return this.itemRepository.save(itemWithTags);
  }
}