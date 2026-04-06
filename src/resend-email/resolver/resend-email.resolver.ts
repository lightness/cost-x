import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { ForgotPasswordInDto } from '../../reset-password/dto';
import { ResendConfirmEmailInDto, ResendEmailOutDto } from '../dto';
import { ResendEmailService } from '../resend-email.service';

@Resolver()
export class ResendEmailResolver {
  constructor(private resendEmailService: ResendEmailService) {}

  @Mutation(() => ResendEmailOutDto)
  async resendConfirmEmail(
    @Args('dto') dto: ResendConfirmEmailInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.resendEmailService.resendConfirmEmail(dto, tx);
  }

  @Mutation(() => ResendEmailOutDto)
  async resendForgotPasswordEmail(
    @Args('dto') dto: ForgotPasswordInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.resendEmailService.resendForgotPasswordEmail(dto, tx);
  }
}
