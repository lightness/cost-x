import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/browser';
import { ForgotPasswordInDto, ResetPasswordInDto } from '../dto';
import { ResetPasswordService } from '../reset-password.service';

@Resolver()
export class ResetPasswordResolver {
  constructor(private resetPasswordService: ResetPasswordService) {}

  @Mutation(() => Boolean)
  async forgotPassword(
    @Args('dto') dto: ForgotPasswordInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.resetPasswordService.sendForgotPasswordEmail(dto, true, tx);

    return true;
  }

  @Mutation(() => Boolean)
  async resetPassword(
    @Args('dto') dto: ResetPasswordInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.resetPasswordService.resetPassword(dto, tx);

    return true;
  }
}
