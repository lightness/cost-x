import { Inject, Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Item, Payment, Tag } from '../../database/entities';
import { IDataloaders, Loader } from './interfaces';
import { CostByCurrency } from '../args/find-items-response.type';

@Injectable()
export class DataloaderService {
  constructor(
    @Inject(Loader.PAYMENTS_BY_ITEM_ID) private paymentsByItemIdLoader: DataLoader<number, Payment[]>,
    @Inject(Loader.TAGS_BY_ITEM_ID) private tagsByItemIdLoader: DataLoader<number, Tag[]>,
    @Inject(Loader.ITEMS_BY_TAG_ID) private itemsByTagIdLoader: DataLoader<number, Item[]>,
    @Inject(Loader.COST_IN_DEFAULT_CURRENCY_BY_ITEM_ID) private costInDefaultCurrencyByItemIdLoader: DataLoader<number, number>,
    @Inject(Loader.COST_BY_CURRENCY_BY_ITEM_ID) private costByCurrencyByItemIdLoader: DataLoader<number, CostByCurrency>,
  ) {}

  getLoaders(): IDataloaders {
    return {
      paymentsByItemIdLoader: this.paymentsByItemIdLoader,
      tagsByItemIdLoader: this.tagsByItemIdLoader,
      itemsByTagIdLoader: this.itemsByTagIdLoader,
      costInDefaultCurrencyByItemIdLoader: this.costInDefaultCurrencyByItemIdLoader,
      costByCurrencyByItemIdLoader: this.costByCurrencyByItemIdLoader,
    };
  }
}