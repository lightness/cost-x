import { UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { CreateUserInDto } from '../dto';
import User from '../entity/user.entity';
import { UserService } from '../user.service';

@Resolver()
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class PublicUserMutationResolver {
  constructor(private userService: UserService) {}

  @Mutation(() => User)
  async createUser(
    @Args('dto', { type: () => CreateUserInDto }) dto: CreateUserInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.create(dto, tx);
  }
}
