import { registerEnumType } from '@nestjs/graphql';
import { StakeRule } from '../../../generated/prisma/enums';

export { StakeRule };

registerEnumType(StakeRule, { name: 'StakeRule' });
