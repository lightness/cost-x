import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ConfirmEmailModule } from '../confirm-email/confirm-email.module';
import { ContactModule } from '../contact/contact.module';
import { GroupModule } from '../group/group.module';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { PublicUserMutationResolver } from './resolver/public-user.mutation.resolver';
import { UserFieldResolver } from './resolver/user.field.resolver';
import { UserMutationResolver } from './resolver/user.mutation.resolver';
import { UserQueryResolver } from './resolver/user.query.resolver';
import { UserLoaderModule } from './user-loader.module';
import { UserService } from './user.service';

@Module({
  exports: [UserService],
  imports: [
    PrismaModule,
    PasswordModule,
    AuthModule,
    AccessModule,
    ConfirmEmailModule,
    WorkspaceModule,
    ContactModule,
    GroupModule,
    UserLoaderModule,
  ],
  providers: [
    // services
    UserService,
    // resolvers
    PublicUserMutationResolver,
    UserMutationResolver,
    UserQueryResolver,
    UserFieldResolver,
  ],
})
export class UserModule {}
