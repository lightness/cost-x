import { NotFoundException } from '@nestjs/common';
import { Args, Context, Float, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { cmp } from 'type-comparator';
import { Repository } from 'typeorm';
import { Item, Payment, Tag } from '../../database/entities';
import { DefaultCurrencyCostService } from '../../item-cost/default-currency-cost.service';
import { IDataloaders } from '../dataloader/interfaces';

@Resolver(() => Item)
export class ItemResolver {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    private defaultCurrencyCostService: DefaultCurrencyCostService,
  ) { }

  @Query(() => Item)
  async item(@Args('id', { type: () => Int }) id: number): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) {
      throw new NotFoundException(id);
    }

    return item;
  }

  @Query(() => [Item])
  async items(): Promise<Item[]> {
    const items = await this.itemRepository.find();

    return items;
  }

  @ResolveField(() => [Payment])
  async payments(
    @Parent() item: Item,
    @Context() { loaders }: { loaders: IDataloaders },
  ) {
    return loaders.paymentsByItemIdLoader.load(item.id);
  }

  @ResolveField(() => [Tag])
  async tags(
    @Parent() item: Item,
  ) {
    const itemWithTags = await this.itemRepository.findOne({
      where: { id: item.id },
      relations: {
        tags: true,
      },
    });

    return itemWithTags.tags;
  }

  @ResolveField(() => Float)
  async costInDefaultCurrency(
    @Parent() item: Item,
    @Context() { loaders }: { loaders: IDataloaders },
  ) {
    const payments = await loaders.paymentsByItemIdLoader.load(item.id);
    const dto = await this.defaultCurrencyCostService.getCostInDefaultCurrency(payments);

    return dto.cost;
  }

  @ResolveField(() => String)
  async firstPaymentDate(
    @Parent() item: Item,
    @Context() { loaders }: { loaders: IDataloaders },
  ) {
    const payments = await loaders.paymentsByItemIdLoader.load(item.id);

    return payments.map(payment => payment.date).sort(cmp().asc()).at(0);
  }

  @ResolveField(() => String)
  async lastPaymentDate(
    @Parent() item: Item,
    @Context() { loaders }: { loaders: IDataloaders },
  ) {
    const payments = await loaders.paymentsByItemIdLoader.load(item.id);

    return payments.map(payment => payment.date).sort(cmp().desc()).at(0);
  }
}