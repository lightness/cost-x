import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfirmEmailService } from './confirm-email.service';
import { UserResolver } from './resolvers/user.resolver';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, MailModule, PasswordModule, AuthModule, AccessModule],
  providers: [
    // services
    UserService,
    ConfirmEmailService,
    // resolvers
    UserResolver,
  ],
  controllers: [UserController],
})
export class UserModule { }
