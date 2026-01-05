import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BcryptService } from './bcrypt.service';
import { UserResolver } from './resolvers/user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [UserService, BcryptService, UserResolver],
})
export class UserModule {}
