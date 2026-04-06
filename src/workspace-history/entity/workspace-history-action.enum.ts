import { registerEnumType } from '@nestjs/graphql';
import { WorkspaceHistoryAction } from '../../../generated/prisma/enums';

registerEnumType(WorkspaceHistoryAction, { name: 'WorkspaceHistoryAction' });

export { WorkspaceHistoryAction };
