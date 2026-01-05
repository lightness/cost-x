import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BcryptService } from './bcrypt.service';
import { UserResolver } from './resolvers/user.resolver';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfirmEmailService } from './confirm-email.service';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [
    // services
    UserService,
    BcryptService,
    ConfirmEmailService,
    // resolvers
    UserResolver,
  ],
  controllers: [UserController],
})
export class UserModule { }
