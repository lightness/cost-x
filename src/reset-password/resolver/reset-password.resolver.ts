import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ForgotPasswordInDto, ResetPasswordInDto } from '../dto';
import { ResetPasswordService } from '../reset-password.service';

@Resolver()
export class ResetPasswordResolver {
  constructor(private resetPasswordService: ResetPasswordService) {}

  @Mutation(() => Boolean)
  async forgotPassword(@Args('dto') dto: ForgotPasswordInDto) {
    await this.resetPasswordService.sendForgotPasswordEmail(dto);

    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(@Args('dto') dto: ResetPasswordInDto) {
    await this.resetPasswordService.resetPassword(dto);

    return true;
  }
}
