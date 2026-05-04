import { registerEnumType } from '@nestjs/graphql';
import { Permission } from '../../generated/prisma/client';

export { Permission };

registerEnumType(Permission, { name: 'Permission' });
