import { registerEnumType } from '@nestjs/graphql';
import { InviteStatus } from '../../../generated/prisma/enums';

registerEnumType(InviteStatus, { name: 'InviteStatus' });

export { InviteStatus };
