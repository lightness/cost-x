import type { CostOutDto } from '../../item-cost/dto';
import type { PaymentOutDto } from '../../payment/dto';
import type { TagOutDto } from '../../tag/dto';

export class ItemOutDto {
  id: number;

  title: string;

  createdAt: Date;

  updatedAt: Date;

  tags?: TagOutDto[];

  payments?: PaymentOutDto[];

  cost?: CostOutDto;
}
