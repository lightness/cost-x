import { Module } from '@nestjs/common';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { ContactFactoryService } from './contact-factory.service';
import { InviteFactoryService } from './invite-factory.service';
import { ItemFactoryService } from './item-factory.service';
import { ItemTagFactoryService } from './item-tag-factory.service';
import { PaymentFactoryService } from './payment-factory.service';
import { TagFactoryService } from './tag-factory.service';
import { UserBlockFactoryService } from './user-block-factory.service';
import { UserFactoryService } from './user-factory.service';
import { WorkspaceFactoryService } from './workspace-factory.service';
import { WorkspaceInviteFactoryService } from './workspace-invite-factory.service';
import { WorkspaceMemberFactoryService } from './workspace-member-factory.service';

const factories = [
  ContactFactoryService,
  InviteFactoryService,
  ItemFactoryService,
  ItemTagFactoryService,
  PaymentFactoryService,
  TagFactoryService,
  UserBlockFactoryService,
  UserFactoryService,
  WorkspaceFactoryService,
  WorkspaceInviteFactoryService,
  WorkspaceMemberFactoryService,
];

@Module({
  exports: [...factories],
  imports: [PrismaModule],
  providers: [...factories],
})
export class FactoryModule {}
