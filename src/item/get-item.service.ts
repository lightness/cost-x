import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Like, Repository } from 'typeorm';
import { Item } from '../database/entities';
import { ListItemQueryDto } from './dto';

@Injectable()
export class GetItemService {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>, 
  ) { }

}