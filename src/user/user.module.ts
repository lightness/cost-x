import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserResolver } from './resolvers/user.resolver';
import { UserService } from './user.service';
import { ConfirmEmailModule } from '../confirm-email/confirm-email.module';

@Module({
  imports: [
    PrismaModule, 
    PasswordModule, 
    AuthModule, 
    AccessModule,
    ConfirmEmailModule,
  ],
  providers: [
    // services
    UserService,
    // resolvers
    UserResolver,
  ],
})
export class UserModule { }
