import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { UserService } from '../user.service';
import { CreateUserInDto, UpdateUserInDto } from '../dto';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  async users() {
    return this.userService.list();
  }

  @Mutation(() => User)
  async createUser(@Args('createUserData') dto: CreateUserInDto) {
    return this.userService.create(dto);
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateUserData') dto: UpdateUserInDto,
  ) {
    return this.userService.update(id, dto);
  }
}