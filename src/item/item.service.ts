import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Like, Repository } from 'typeorm';
import { Item } from '../database/entities';
import { ItemInDto, ListItemQueryDto } from './dto';

@Injectable()
export class ItemService {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>) {}


  async getById(id: number): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id });
    
    return item;
  }

  async list(query: ListItemQueryDto): Promise<Item[]> {
    const { title, tagIds } = query || {};

    const options: FindManyOptions<Item> = {};
    options.where = {};

    if (title) {
      options.where = { 
        ...options.where, 
        title: Like(`%${title}%`),
      };
    }

    if (tagIds) {
      options.where = { 
        ...options.where, 
        tags: { 
          id: In(tagIds),
        },
      };
    }

    const items = await this.itemRepository.find(options);

    return items;
  }

  async create(dto: ItemInDto): Promise<Item> {
    const item = await this.itemRepository.save(dto);

    return item;
  }

  async update(item: Item, dto: ItemInDto): Promise<Item> {
    item.title = dto.title;

    return this.itemRepository.save(item);
  }

  async delete(item: Item): Promise<void> {
    await this.itemRepository.remove(item);
  }
}