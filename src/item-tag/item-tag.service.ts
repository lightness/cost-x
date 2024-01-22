import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemTag, Tag } from '../database/entities';

@Injectable()
export class ItemTagService {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(Tag) private tagRepository: Repository<Tag>,
    @InjectRepository(ItemTag) private itemTagRepository: Repository<ItemTag>,
  ) {}

  async setTag(itemId: number, tagId: number) {
    const [item, tag, existingItemTag] = await Promise.all([
      this.itemRepository.findOneBy({ id: itemId }),
      this.tagRepository.findOneBy({ id: tagId }),
      this.itemTagRepository.findOneBy({ itemId, tagId }),
    ]);

    if (!item) {
      throw new BadRequestException(`Item #${itemId} does not exist`);
    }

    if (!tag) {
      throw new BadRequestException(`Tag #${tagId} does not exist`);
    }

    if (existingItemTag) {
      throw new BadRequestException(`Item #${itemId} already has tag #${tagId}`);
    }

    return this.itemTagRepository.save({ itemId, tagId });
  }

  async removeTag(itemId: number, tagId: number) {
    const existingItemTag = await this.itemTagRepository.findOneBy({ itemId, tagId });

    if (!existingItemTag) {
      throw new BadRequestException(`Item #${itemId} does not have tag #${tagId}`);
    }

    await this.itemTagRepository.remove(existingItemTag);
  }
}