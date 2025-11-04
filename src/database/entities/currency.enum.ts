import { registerEnumType } from '@nestjs/graphql';

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  BYN = 'BYN',
}

registerEnumType(Currency, { name: 'Currency' });