import { Currency } from '../../database/entities/currency.enum';

export class PaymentOutDto {
  id: number;
  cost: number;
  currency: Currency;
  date: string;
}