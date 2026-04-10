import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsByUserIdLoader } from './dataloader/permissions-by-user-id.loader';
import { UserByUserIdLoader } from './dataloader/user-by-user-id.loader';

@Module({
  exports: [UserByUserIdLoader, PermissionsByUserIdLoader],
  imports: [PrismaModule, GroupModule],
  providers: [UserByUserIdLoader, PermissionsByUserIdLoader],
})
export class UserLoaderModule {}
