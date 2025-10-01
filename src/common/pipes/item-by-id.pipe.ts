import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../database/entities';

@Injectable()
export class ItemByIdPipe implements PipeTransform<number, Promise<Item>> {
  constructor(@InjectRepository(Item) private itemRepository: Repository<Item>) {}

  async transform(value: number): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id: value });

    if (!item) {
      throw new NotFoundException(`Item #${value} not found`);
    }

    return item;
  }
}