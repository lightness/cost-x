import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemTag, Tag } from '../database/entities';

@Injectable()
export class ItemTagService {
  constructor(
    @InjectRepository(ItemTag) private itemTagRepository: Repository<ItemTag>,
  ) {}

  async setTag(item: Item, tag: Tag) {
    const existingItemTag = await this.itemTagRepository.findOneBy({ itemId: item.id, tagId: tag.id });

    if (existingItemTag) {
      throw new BadRequestException(`Item #${item.id} already has tag #${tag.id}`);
    }

    return this.itemTagRepository.save({ itemId: item.id, tagId: tag.id });
  }

  async removeTag(item: Item, tag: Tag) {
    const existingItemTag = await this.itemTagRepository.findOneBy({ itemId: item.id, tagId: tag.id });

    if (!existingItemTag) {
      throw new BadRequestException(`Item #${item.id} does not have tag #${tag.id}`);
    }

    await this.itemTagRepository.remove(existingItemTag);
  }
}