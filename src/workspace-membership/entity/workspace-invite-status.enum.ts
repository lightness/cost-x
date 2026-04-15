import { registerEnumType } from '@nestjs/graphql';
import { WorkspaceInviteStatus } from '../../../generated/prisma/enums';

registerEnumType(WorkspaceInviteStatus, { name: 'WorkspaceInviteStatus' });

export { WorkspaceInviteStatus };
