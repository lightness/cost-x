import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../database/entities';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => Item)
export class ItemResolver {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
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
}