import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserByUserIdLoader } from './dataloader/user-by-user-id.loader';

@Module({
  imports: [PrismaModule, GroupModule],
  providers: [UserByUserIdLoader],
  exports: [UserByUserIdLoader],
})
export class UserLoaderModule {}
