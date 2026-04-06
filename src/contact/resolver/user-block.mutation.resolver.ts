import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/browser';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { CreateUserBlockInDto, RemoveUserBlockInDto } from '../dto';
import { UserBlock } from '../entity/user-block.entity';
import { UserBlockValidationService } from '../user-block-validation.service';
import { UserBlockService } from '../user-block.service';

@Resolver()
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
@UseGuards(AuthGuard, AccessGuard)
export class UserBlockMutationResolver {
  constructor(
    private userBlockService: UserBlockService,
    private userBlockValidationService: UserBlockValidationService,
  ) {}

  @Mutation(() => UserBlock)
  @Access.allow([
    {
      role: UserRole.USER,
      targetId: fromArg('dto.blockerId'),
      targetScope: AccessScope.USER,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
  ])
  async blockUser(
    @Args('dto') dto: CreateUserBlockInDto,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.userBlockValidationService.validateCreateUserBlock(dto, tx);

    return this.userBlockService.blockUser(dto.blockedId, dto.blockerId, currentUser.id, tx);
  }

  @Mutation(() => UserBlock)
  @Access.allow([
    {
      role: UserRole.USER,
      targetId: fromArg('dto.blockerId'),
      targetScope: AccessScope.USER,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
  ])
  async unblockUser(
    @Args('dto') dto: RemoveUserBlockInDto,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.userBlockValidationService.validateRemoveUserBlock(dto, tx);

    return this.userBlockService.removeUserBlock(dto.blockedId, dto.blockerId, currentUser.id, tx);
  }
}
