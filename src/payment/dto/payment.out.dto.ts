import type { CostOutDto } from '../../item-cost/dto';
import { PaymentInDto } from './payment.in.dto';

export class PaymentOutDto extends PaymentInDto {
  id: number;

  costInDefaultCurrency?: CostOutDto;
}
