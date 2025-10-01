import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { Item } from '../database/entities';
import { ItemInDto, ItemOutDto } from './dto';

@Injectable()
export class ItemService {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>) {}

  async create(dto: ItemInDto): Promise<ItemOutDto> {
    const item = await this.itemRepository.save(dto);

    return item;
  }

  async update(item: Item, dto: ItemInDto): Promise<ItemOutDto> {
    item.title = dto.title;

    return this.itemRepository.save(item);
  }

  async delete(item: Item): Promise<void> {
    await this.itemRepository.remove(item);
  }
}