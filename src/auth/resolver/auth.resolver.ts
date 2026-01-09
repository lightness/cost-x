import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthInDto, AuthOutDto } from '../dto';
import { AuthService } from '../auth.service';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthOutDto)
  async authenticate(@Args('dto', { type: () => AuthInDto }) dto: AuthInDto): Promise<AuthOutDto> {
    return this.authService.authenticate(dto);
  }

}