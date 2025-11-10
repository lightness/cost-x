import DataLoader from 'dataloader';
import { Item, Payment, Tag } from '../../database/entities';

export interface IDataloaders {
  paymentsByItemIdLoader: DataLoader<number, Payment[]>;
  tagsByItemIdLoader: DataLoader<number, Tag[]>;
  itemsByTagIdLoader: DataLoader<number, Item[]>;
}