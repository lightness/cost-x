import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetItemQueryDto, ItemOutDto, ListItemQueryDto } from './dto';
import { Item, Payment } from '../database/entities';
import { ItemCostService } from '../item-cost/item-cost.service';

@Injectable()
export class GetItemService {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>, private itemCostService: ItemCostService) { }

  async get(item: Item, query: GetItemQueryDto): Promise<ItemOutDto | null> {
    const { withTags, withPayments, withTotal, withPaymentDates } = query;

    const options: FindOneOptions<Item> = {
      where: { id: item.id },
      relations: this.getRelations(withTags, withPayments, withTotal, withPaymentDates),
    }

    const itemWithRelations = await this.itemRepository.findOne(options);

    return this.composeDto(itemWithRelations, withPayments, withTotal, withPaymentDates);
  }

  async list(query: ListItemQueryDto): Promise<ItemOutDto[]> {
    const { term, withTags, withPayments, withPaymentDates, withTotal } = query;

    const options: FindManyOptions<Item> = {
      relations: this.getRelations(withTags, withPayments, withTotal, withPaymentDates),
    };

    if (term) {
      options.where = { title: Like(`%${term}%`) };
    }

    const items = await this.itemRepository.find(options);
    const dtos = [];

    for (const item of items) {
      dtos.push(await this.composeDto(item, withPayments, withTotal, withPaymentDates));
    }

    return dtos;
  }

  private getRelations(withTags: boolean, withPayments: boolean, withTotal: boolean, withPaymentDates: boolean) {
    let relations = {};

    if (withTags) {
      relations = {
        ...relations,
        tags: true,
      };
    }

    if (withPayments || withTotal || withPaymentDates) {
      relations = {
        ...relations,
        payments: true,
      };
    }

    return relations;
  }

  private async composeDto(item: Item, withPayments: boolean, withTotal: boolean, withPaymentDates: boolean) {
    const { tags, payments, ...ownProperties } = item;
    const total = withTotal ? await this.itemCostService.getCost(item.payments) : undefined;
    const paymentDates = withPaymentDates ? this.getPaymentDates(payments) : undefined;

    return {
      ...ownProperties,
      total,
      tags,
      paymentDates,
      payments: withPayments ? payments : undefined,
    };
  }

  private getPaymentDates(payments: Payment[]): { first: string, last: string } {
    const dates = payments.map(({ date }) => date).sort();

    return {
      first: dates[0],
      last: dates[dates.length - 1],
    };
  }
}