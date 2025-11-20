import DataLoader from 'dataloader';
import { Item, Payment, Tag } from '../../database/entities';
import { CostByCurrency } from '../args/find-items-response.type';

export interface IDataloaders {
  paymentsByItemIdLoader: DataLoader<number, Payment[]>;
  tagsByItemIdLoader: DataLoader<number, Tag[]>;
  itemsByTagIdLoader: DataLoader<number, Item[]>;
  costInDefaultCurrencyByItemIdLoader: DataLoader<number, number>;
  costByCurrencyByItemIdLoader: DataLoader<number, CostByCurrency>;
}

export const Loader = Object.freeze({
  PAYMENTS_BY_ITEM_ID: Symbol('paymentsByItemIdLoader'),
  TAGS_BY_ITEM_ID: Symbol('tagsByItemIdLoader'),
  ITEMS_BY_TAG_ID: Symbol('itemsByTagIdLoader'),
  COST_IN_DEFAULT_CURRENCY_BY_ITEM_ID: Symbol('costInDefaultCurrencyByItemIdLoader'),
  COST_BY_CURRENCY_BY_ITEM_ID: Symbol('costByCurrencyByItemIdLoader'),
});