import { Currency } from '../../database/entities/currency.enum';
import { CostOutDto } from '../../item-cost/dto';
import { PaymentOutDto } from '../../payment/dto';
import { TagOutDto } from '../../tag/dto';

export class ItemOutDto {
  title: string;

  createdAt: Date;

  updatedAt: Date;

  tags?: TagOutDto[];
  
  payments?: PaymentOutDto[];

  cost?: CostOutDto;
}