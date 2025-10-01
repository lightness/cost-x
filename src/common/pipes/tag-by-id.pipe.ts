import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../database/entities';

@Injectable()
export class TagByIdPipe implements PipeTransform<number, Promise<Tag>> {
  constructor(@InjectRepository(Tag) private tagRepository: Repository<Tag>) {}

  async transform(value: number): Promise<Tag> {
    const tag = await this.tagRepository.findOneBy({ id: value });

    if (!tag) {
      throw new NotFoundException(`Tag #${value} not found`);
    }

    return tag;
  }
}