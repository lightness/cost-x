import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../database/entities';
import { ItemInDto, ListItemQueryDto } from './dto';

@Injectable()
export class ItemService {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>) { }

  async getById(id: number): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id });

    return item;
  }

  async list(query: ListItemQueryDto): Promise<Item[]> {
    const { title, tagIds, paymentDateFrom, paymentDateTo } = query || {};

    const queryBuilder = this.itemRepository
      .createQueryBuilder('item');

    if (title) {
      queryBuilder.andWhere('item.title LIKE :title', { title: `%${title}%` });
    }

    if (tagIds && tagIds.length > 0) {
      queryBuilder
        .innerJoin('item.itemTags', 'itemTags')
        .andWhere('itemTags.tagId IN (:...tagIds)', { tagIds });
    }

    if (paymentDateFrom || paymentDateTo) {
      queryBuilder.innerJoin('item.payments', 'payments');

      if (paymentDateFrom && paymentDateTo) {
        queryBuilder.andWhere('payments.date BETWEEN :paymentDateFrom AND :paymentDateTo', {
          paymentDateFrom,
          paymentDateTo
        });
      } else if (paymentDateFrom) {
        queryBuilder.andWhere('payments.date >= :paymentDateFrom', { paymentDateFrom });
      } else if (paymentDateTo) {
        queryBuilder.andWhere('payments.date <= :paymentDateTo', { paymentDateTo });
      }
    }

    queryBuilder.distinct(true);

    return await queryBuilder.getMany();
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

  // async list(): Promise<FindItemsResponse> {
  //   const items = await this.itemRepository.find({});

  //   return items;
  // }

  // private
}