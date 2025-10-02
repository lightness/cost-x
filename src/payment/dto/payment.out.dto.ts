import { Currency } from '../../database/entities/currency.enum';

export class PaymentOutDto {
  id: number;
  title?: string;
  cost: number;
  currency: Currency;
  date: string;
}