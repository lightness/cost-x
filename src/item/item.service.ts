import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, FindOptions, Like, Repository } from 'typeorm';
import { Item } from '../database/entities';
import { ItemInDto, ItemOutDto } from './dto';

@Injectable()
export class ItemService {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>) {}

  async list(term?: string, withTags?: boolean, withPayments?: boolean): Promise<ItemOutDto[]> {
    const options: FindManyOptions<Item> = {
      relations: this.getRelations(withTags, withPayments),
    };

    if (term) {
      options.where = { title: Like(`%${term}%`) };
    }
    
    const tags = await this.itemRepository.find(options);

    return tags;
  }

  async create(dto: ItemInDto): Promise<ItemOutDto> {
    const item = await this.itemRepository.save(dto);

    return item;
  }

  async get(id: number, withTags?: boolean, withPayments?: boolean): Promise<ItemOutDto | null> {
    const options: FindOneOptions<Item> = {
      where: { id },
      relations: this.getRelations(withTags, withPayments),
    }

    const item = await this.itemRepository.findOne(options);

    return item;
  }

  async update(id: number, dto: ItemInDto): Promise<ItemOutDto> {
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) {
      throw new BadRequestException(`Item #${id} does not exist`);
    }

    item.title = dto.title;

    return this.itemRepository.save(item);
  }

  async delete(id: number): Promise<void> {
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) {
      throw new BadRequestException(`Item #${id} does not exist`);
    }

    await this.itemRepository.remove(item);
  }

  private getRelations(withTags?: boolean, withPayments?: boolean) {
    let relations = {};

    if (withTags) {
      relations = {
        ...relations,
        tags: true,
      };
    }

    if (withPayments) {
      relations = {
        ...relations,
        payments: true, 
      };
    }

    return relations;
  }
}