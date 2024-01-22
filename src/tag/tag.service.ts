import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../database/entities';
import { TagInDto, TagOutDto } from './dto';

export class TagService {
  constructor(@InjectRepository(Tag) private tagRepository: Repository<Tag>) {}

  async list(term?: string): Promise<TagOutDto[]> {
    const tags = await this.tagRepository.find();

    return tags;
  }

  async create(dto: TagInDto): Promise<TagOutDto> {
    const tag = await this.tagRepository.save(dto);

    return tag;
  }

  async get(id: number): Promise<TagOutDto | null> {
    const tag = await this.tagRepository.findOneBy({ id });

    return tag;
  }

  async update(id: number, dto: TagInDto): Promise<TagOutDto> {
    const tag = await this.tagRepository.findOneBy({ id });

    if (!tag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    tag.title = dto.title;

    return this.tagRepository.save(tag);
  }

  async delete(id: number): Promise<void> {
    const tag = await this.tagRepository.findOneBy({ id });

    if (!tag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    await this.tagRepository.remove(tag);
  }

}