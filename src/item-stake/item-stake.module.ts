import { forwardRef, Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { ItemModule } from '../item/item.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceMembershipModule } from '../workspace-membership/workspace-membership.module';
import { ItemStakesByItemIdLoader } from './dataloader/item-stakes-by-item-id.loader.service';
import { ItemStakeService } from './item-stake.service';
import { OverrideItemStakeService } from './override-item-stake.service';
import { ItemItemStakesFieldResolver } from './resolver/item-item-stakes.field.resolver';
import { ItemStakeFieldResolver } from './resolver/item-stake.field.resolver';
import { ItemStakeMutationResolver } from './resolver/item-stake.mutation.resolver';

@Module({
  exports: [ItemStakesByItemIdLoader],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    GroupModule,
    WorkspaceMembershipModule,
    forwardRef(() => ItemModule),
  ],
  providers: [
    ItemStakeService,
    OverrideItemStakeService,
    // resolver
    ItemStakeMutationResolver,
    ItemStakeFieldResolver,
    ItemItemStakesFieldResolver,
    // dataloader
    ItemStakesByItemIdLoader,
  ],
})
export class ItemStakeModule {}
