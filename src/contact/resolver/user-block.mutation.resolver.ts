import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/browser';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { Permission } from '../../access/permission.enum';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
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
  @Access.allow({
    or: [
      { and: [{ self: 'blockerUser' }, { scope: AccessScope.USER, permission: Permission.BLOCK_USER }] },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('blockerUser', { from: fromArg('dto.blockerId'), pipes: [UserByIdPipe] })
  async blockUser(
    @Args('dto') dto: CreateUserBlockInDto,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.userBlockValidationService.validateCreateUserBlock(dto, tx);

    return this.userBlockService.blockUser(dto.blockedId, dto.blockerId, currentUser.id, tx);
  }

  @Mutation(() => UserBlock)
  @Access.allow({
    or: [
      { and: [{ self: 'blockerUser' }, { scope: AccessScope.USER, permission: Permission.UNBLOCK_USER }] },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('blockerUser', { from: fromArg('dto.blockerId'), pipes: [UserByIdPipe] })
  async unblockUser(
    @Args('dto') dto: RemoveUserBlockInDto,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.userBlockValidationService.validateRemoveUserBlock(dto, tx);

    return this.userBlockService.removeUserBlock(dto.blockedId, dto.blockerId, currentUser.id, tx);
  }
}
