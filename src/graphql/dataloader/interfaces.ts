import DataLoader from 'dataloader';
import { Payment } from '../../database/entities';

export interface IDataloaders {
  paymentsByItemIdLoader: DataLoader<number, Payment[]>;
}