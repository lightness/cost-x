import { Currency } from '../../database/entities/currency.enum';

export class PaymentInDto {
  title?: string;

  cost: number;
  currency: Currency;
  date: string;
}