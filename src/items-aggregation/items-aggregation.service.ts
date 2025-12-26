import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Item, Payment } from '../database/entities';
import { ItemsFilter } from '../item/dto';
import { PaymentsFilter } from '../payment/dto';

@Injectable()
export class ItemsAggregationService {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
  ) { }

  async getIds(itemsFilter: ItemsFilter, paymentsFilter: PaymentsFilter): Promise<number[]> {
    const rows = await this.itemRepository
      .createQueryBuilder('i')
      .where(this.getWhereClause(itemsFilter, paymentsFilter))
      .select('i.id', 'id')
      .getRawMany<{ id: number }>();

    return rows.map(row => row.id);
  }

  // count

  async getCount(itemsFilter: ItemsFilter, paymentsFilter: PaymentsFilter): Promise<number> {
    const row = await this.itemRepository
      .createQueryBuilder('i')
      .where(this.getWhereClause(itemsFilter, paymentsFilter))
      .select('COUNT(*)', 'count')
      .getRawOne<{ count: number }>()

    return row.count;
  }

  // other

  private getWhereClause(itemsFilter: ItemsFilter, paymentsFilter: PaymentsFilter): Brackets {
    const { title, tagIds } = itemsFilter;
    const { dateFrom: paymentDateFrom, dateTo: paymentDateTo } = paymentsFilter;
    const hasPaymentsFilter = Boolean(paymentDateFrom) || Boolean(paymentDateTo);

    return new Brackets(qb => {
      const subQuery = this.paymentRepository
        .createQueryBuilder('p')
        .select('1')
        .where('p.itemId = i.id')
        .andWhere(paymentDateFrom ? 'p.date >= :paymentDateFrom' : '1=1')
        .andWhere(paymentDateTo ? 'p.date < :paymentDateTo' : '1=1')
        .getQuery();

      qb.where(title ? 'i.title LIKE :title' : '1=1', { title: `%${title}%` })
        .andWhere(tagIds ? 'i.tagId IN (:...tagIds)' : '1=1', { tagIds })
        .andWhere(`EXISTS (${subQuery})`, { paymentDateFrom, paymentDateTo });
    });
  }
}
