import { Injectable } from '@nestjs/common';
import { IDataloaders } from './interfaces';
import { PaymentsByItemIdLoader } from './payments-by-item-id.loader';
import { TagsByItemIdLoader } from './tags-by-item-id.loader';
import { ItemsByTagIdLoader } from './items-by-tag-id.loader';

@Injectable()
export class DataloaderService {
  constructor(
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
    private tagsByItemIdLoader: TagsByItemIdLoader,
    private itemsByTagIdLoader: ItemsByTagIdLoader,
  ) {}

  getLoaders(): IDataloaders {
    return {
      paymentsByItemIdLoader: this.paymentsByItemIdLoader.createLoader(),
      tagsByItemIdLoader: this.tagsByItemIdLoader.createLoader(),
      itemsByTagIdLoader: this.itemsByTagIdLoader.createLoader(),
    };
  }
}