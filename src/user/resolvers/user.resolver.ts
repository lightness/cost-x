import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { UserService } from '../user.service';
import { CreateUserInDto } from '../dto';

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

}