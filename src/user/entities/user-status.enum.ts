import { registerEnumType } from '@nestjs/graphql';
import { UserStatus } from '../../../generated/prisma/enums';

registerEnumType(UserStatus, { name: 'UserStatus' });

export { UserStatus };
