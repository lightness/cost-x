import { Injectable } from '@nestjs/common';
import { FindManyOptions, FindOneOptions, In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GetItemQueryDto, ItemOutDto, ListItemQueryDto } from './dto';
import { Item, Payment } from '../database/entities';
import { ItemCostService } from '../item-cost/item-cost.service';
import { PaymentOutDto } from '../payment/dto';

@Injectable()
export class GetItemService {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>, private itemCostService: ItemCostService) { }

  async get(item: Item, query: GetItemQueryDto): Promise<ItemOutDto | null> {
    const { withTags, withPayments, withCostInDefaultCurrency, withTotal, withPaymentDates } = query;

    const options: FindOneOptions<Item> = {
      where: { id: item.id },
      relations: this.getRelations(withTags, withPayments, withCostInDefaultCurrency, withTotal, withPaymentDates),
    }

    const itemWithRelations = await this.itemRepository.findOne(options);

    return this.composeDto(itemWithRelations, withPayments, withCostInDefaultCurrency, withTotal, withPaymentDates);
  }

  async list(query: ListItemQueryDto): Promise<ItemOutDto[]> {
    const { term, tagIds, withTags, withPayments, withPaymentDates, withCostInDefaultCurrency, withTotal } = query;

    const options: FindManyOptions<Item> = {
      relations: this.getRelations(withTags, withPayments, withCostInDefaultCurrency, withTotal, withPaymentDates),
    };

    options.where = {}

    if (term) {
      options.where = { 
        ...options.where, 
        title: Like(`%${term}%`),
      };
    }

    if (tagIds) {
      options.where = { 
        ...options.where, 
        itemTags: { 
          tagId: In(tagIds),
        },
      };
    }

    const items = await this.itemRepository.find(options);
    const dtos = [];

    for (const item of items) {
      dtos.push(await this.composeDto(item, withPayments, withCostInDefaultCurrency, withTotal, withPaymentDates));
    }

    return dtos;
  }

  private getRelations(withTags: boolean, withPayments: boolean, withCostInDefaultCurrency: boolean, withTotal: boolean, withPaymentDates: boolean) {
    let relations = {};

    if (withTags) {
      relations = {
        ...relations,
        itemTags: {
          tag: true,
        },
      };
    }

    if (withPayments || withTotal || withPaymentDates || withCostInDefaultCurrency) {
      relations = {
        ...relations,
        payments: true,
      };
    }

    return relations;
  }

  private async composeDto(item: Item, withPayments: boolean, withCostInDefaultCurrency: boolean, withTotal: boolean, withPaymentDates: boolean) {
    const { itemTags, ...ownProperties } = item;
    const total = withTotal ? await this.itemCostService.getCost(item.payments) : undefined;
    const paymentDates = withPaymentDates ? this.getPaymentDates(item.payments) : undefined;
    const payments = withCostInDefaultCurrency ? await this.enrichPaymentWithCostInDefaultCurrency(item.payments) : item.payments;

    return {
      ...ownProperties,
      total,
      tags: itemTags.map(({ tag }) => tag),
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

  private async enrichPaymentWithCostInDefaultCurrency(payments: Payment[]): Promise<PaymentOutDto[]> {
    return Promise.all(payments.map(async (payment) => {
      const costInDefaultCurrency = await this.itemCostService.getCost([payment]);

      return {
        ...payment,
        costInDefaultCurrency,
      }
    }));
  }
}