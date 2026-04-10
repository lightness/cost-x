import { registerEnumType } from '@nestjs/graphql';
import { Permission } from '../../../generated/prisma/enums';

registerEnumType(Permission, { name: 'Permission' });

export { Permission };
