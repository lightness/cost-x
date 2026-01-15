import {
  Injectable,
  NotFoundException,
  type PipeTransform,
} from '@nestjs/common';
import Item from '../../item/entities/item.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ItemByIdPipe implements PipeTransform<number, Promise<Item>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<Item> {
    const item = await this.prisma.item.findFirst({ where: { id: value } });

    if (!item) {
      throw new NotFoundException(`Item #${value} not found`);
    }

    return item;
  }
}
