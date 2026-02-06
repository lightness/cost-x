import { registerEnumType } from '@nestjs/graphql';
import { Currency } from '../../../generated/prisma/enums';

registerEnumType(Currency, { name: 'Currency' });

export { Currency };
