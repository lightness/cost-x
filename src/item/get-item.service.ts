import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ItemOutDto } from './dto';
import { Item } from '../database/entities';
import { ItemCostService } from '../item-cost/item-cost.service';

@Injectable()
export class GetItemService {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>, private itemCostService: ItemCostService) { }

  async get(item: Item, withTags?: boolean, withPayments?: boolean, withItemCost?: boolean): Promise<ItemOutDto | null> {
    const options: FindOneOptions<Item> = {
      where: { id: item.id },
      relations: this.getRelations(withTags, withPayments, withItemCost),
    }

    const itemWithRelations = await this.itemRepository.findOne(options);

    return this.composeDto(itemWithRelations, withPayments, withItemCost);
  }

  async list(term?: string, withTags?: boolean, withPayments?: boolean, withItemCost?: boolean): Promise<ItemOutDto[]> {
    const options: FindManyOptions<Item> = {
      relations: this.getRelations(withTags, withPayments, withItemCost),
    };

    if (term) {
      options.where = { title: Like(`%${term}%`) };
    }

    const items = await this.itemRepository.find(options);
    const dtos = [];

    for (const item of items) {
      dtos.push(await this.composeDto(item, withPayments, withItemCost));
    }

    return dtos;
  }

  private getRelations(withTags?: boolean, withPayments?: boolean, withItemCost?: boolean) {
    let relations = {};

    if (withTags) {
      relations = {
        ...relations,
        tags: true,
      };
    }

    if (withPayments || withItemCost) {
      relations = {
        ...relations,
        payments: true,
      };
    }

    return relations;
  }

  private async composeDto(item: Item, withPayments: boolean, withItemCost: boolean) {
    const { tags, payments, ...ownProperties } = item;
    const cost = withItemCost ? await this.itemCostService.getCost(item.payments) : undefined;

    return {
      ...ownProperties,
      cost,
      tags,
      payments: withPayments ? payments : undefined,
    };
  }
}