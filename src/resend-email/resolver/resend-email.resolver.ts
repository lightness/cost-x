import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ForgotPasswordInDto } from '../../reset-password/dto';
import { ResendConfirmEmailInDto, ResendEmailOutDto } from '../dto';
import { ResendEmailService } from '../resend-email.service';

@Resolver()
export class ResendEmailResolver {
  constructor(private resendEmailService: ResendEmailService) {}

  @Mutation(() => ResendEmailOutDto)
  async resendConfirmEmail(@Args('dto') dto: ResendConfirmEmailInDto) {
    return this.resendEmailService.resendConfirmEmail(dto);
  }

  @Mutation(() => ResendEmailOutDto)
  async resendForgotPasswordEmail(@Args('dto') dto: ForgotPasswordInDto) {
    return this.resendEmailService.resendForgotPasswordEmail(dto);
  }
}
