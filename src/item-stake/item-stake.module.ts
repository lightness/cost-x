import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceMembershipModule } from '../workspace-membership/workspace-membership.module';
import { ItemStakesByItemIdLoader } from './dataloader/item-stakes-by-item-id.loader.service';
import { ItemStakeService } from './item-stake.service';
import { OverrideItemStakeService } from './override-item-stake.service';
import { ItemStakeMutationResolver } from './resolver/item-stake.mutation.resolver';

@Module({
  exports: [ItemStakesByItemIdLoader],
  imports: [PrismaModule, AuthModule, AccessModule, GroupModule, WorkspaceMembershipModule],
  providers: [
    ItemStakeService,
    OverrideItemStakeService,
    // resolver
    ItemStakeMutationResolver,
    // dataloader
    ItemStakesByItemIdLoader,
  ],
})
export class ItemStakeModule {}
