import { registerEnumType } from '@nestjs/graphql';
import { UserRole } from '../../../generated/prisma/enums';

registerEnumType(UserRole, { name: 'UserRole' });

export { UserRole };
