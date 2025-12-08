import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Tag } from '../database/entities';
import { ListTagQueryDto, TagInDto, TagOutDto } from './dto';

export class TagService {
  constructor(
    @InjectRepository(Tag) private tagRepository: Repository<Tag>,
  ) {}

  async getById(id: number): Promise<Tag | null> {
    const tag = await this.tagRepository.findOneBy({ id });

    return tag;
  }

  async list(query: ListTagQueryDto): Promise<Tag[]> {
    let { title } =  query || {};

    const options: FindOptionsWhere<Tag> = {};

    if (title) {
      options.title = Like(`%${title}%`);
    }

    const tags = await this.tagRepository.findBy(query);

    return tags;
  }

  async create(dto: TagInDto): Promise<TagOutDto> {
    const tag = await this.tagRepository.save(dto);

    return tag;
  }

  async update(id: number, dto: TagInDto): Promise<TagOutDto> {
    const tag = await this.tagRepository.findOneBy({ id });

    if (!tag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    tag.title = dto.title;
    tag.color = dto.color;

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
