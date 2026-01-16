import { CostOutDto } from '../../item-cost/dto';
import { PaymentOutDto } from '../../payment/dto';
import { TagOutDto } from '../../tag/dto';

export class ItemOutDto {
  id: number;

  title: string;

  createdAt: Date;

  updatedAt: Date;

  tags?: TagOutDto[];

  payments?: PaymentOutDto[];

  cost?: CostOutDto;
}
