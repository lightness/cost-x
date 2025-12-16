import { registerEnumType } from '@nestjs/graphql';
import { Currency } from '../database/entities/currency.enum';

registerEnumType(Currency, { name: 'Currency' });
