import { Currency } from '../../database/entities/currency.enum';

export class PaymentInDto {
  cost: number;
  currency: Currency;
  date: Date;
}