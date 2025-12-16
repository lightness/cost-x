import DataLoader from 'dataloader';
import { Item, Payment, Tag } from '../../database/entities';
import { GetCurrencyRateInDto } from '../../currency-rate/dto';
import { CurrencyRateEntity } from '../entities/currency-rate.entity';

export enum LoaderName {
  CURRENCY_RATE = 'currencyRateLoader',
  PAYMENTS_BY_ITEM_ID = 'paymentsByItemIdLoader',
  TAGS_BY_ITEM_ID = 'tagsByItemIdLoader',
  ITEMS_BY_TAG_ID = 'itemsByTagIdLoader',
}

export interface IDataloaders {
  [LoaderName.CURRENCY_RATE]: DataLoader<GetCurrencyRateInDto, number, string>;
  [LoaderName.PAYMENTS_BY_ITEM_ID]: DataLoader<number, Payment[]>;
  [LoaderName.TAGS_BY_ITEM_ID]: DataLoader<number, Tag[]>;
  [LoaderName.ITEMS_BY_TAG_ID]: DataLoader<number, Item[]>;
}

export interface IDataloaderService<K, V, C = K> {
  get loaderName(): LoaderName;

  createDataloader(dataloaders?: Partial<IDataloaders>): DataLoader<K, V, C>;
}