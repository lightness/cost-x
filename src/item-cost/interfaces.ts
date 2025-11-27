import { Payment } from '../database/entities';

export type PaymentLike = Pick<Payment, 'cost' | 'currency' | 'date'>;
