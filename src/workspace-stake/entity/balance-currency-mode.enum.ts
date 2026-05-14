import { registerEnumType } from '@nestjs/graphql';
import { BalanceCurrencyMode } from '../../../generated/prisma/enums';

export { BalanceCurrencyMode };

registerEnumType(BalanceCurrencyMode, { name: 'BalanceCurrencyMode' });
