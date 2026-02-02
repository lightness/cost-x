import {
  Injectable,
  NotFoundException,
  type PipeTransform,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../../tag/entity/tag.entity';

@Injectable()
export class TagByIdPipe implements PipeTransform<number, Promise<Tag>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<Tag> {
    const tag = await this.prisma.tag.findFirst({ where: { id: value } });

    if (!tag) {
      throw new NotFoundException(`Tag #${value} not found`);
    }

    return tag;
  }
}
