import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentBalanceModule } from '../payment-balance/payment-balance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceStakeMutationResolver } from './resolver/workspace-stake.mutation.resolver';
import { WorkspaceStakeService } from './workspace-stake.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule, PaymentBalanceModule],
  providers: [
    WorkspaceStakeService,
    // resolver
    WorkspaceStakeMutationResolver,
  ],
})
export class WorkspaceStakeModule {}
