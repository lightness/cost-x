import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserCreateInput, UserCreateManyInput } from '../../generated/prisma/models';
import { Permission } from '../../generated/prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import User from '../../src/user/entity/user.entity';
import { KindBasedFactoryService } from './base-factory.service';

const DEFAULT_USER_PERMISSIONS: Permission[] = [
  Permission.CREATE_WORKSPACE,
  Permission.UPDATE_PROFILE,
  Permission.CREATE_CONTACT_INVITE,
  Permission.ACCEPT_CONTACT_INVITE,
  Permission.REJECT_CONTACT_INVITE,
  Permission.BLOCK_USER,
  Permission.UNBLOCK_USER,
  Permission.DELETE_CONTACT,
  Permission.ACCEPT_WORKSPACE_INVITE,
  Permission.REJECT_WORKSPACE_INVITE,
];

export type UserKind = 'active' | 'email_not_verified' | 'banned';

@Injectable()
export class UserFactoryService
  implements KindBasedFactoryService<UserKind, User, UserCreateManyInput, UserCreateInput>
{
  constructor(private prisma: PrismaService) {}

  async create(
    kind: UserKind = 'active',
    overrides: Partial<UserCreateManyInput> = {},
  ): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        ...(await this.generate(kind, overrides)),
      },
    });

    await this.prisma.userPermission.createMany({
      data: DEFAULT_USER_PERMISSIONS.map((permission) => ({ permission, userId: user.id })),
    });

    return user;
  }

  async generate(
    kind: UserKind = 'active',
    overrides: Partial<UserCreateManyInput> = {},
  ): Promise<UserCreateInput> {
    return {
      confirmEmailTempCode: this.generateConfirmEmailTempCode(kind),
      email: this.generateEmail(),
      isBanned: this.generateBanned(kind),
      name: this.generateName(),
      password: this.generatePassword(),
      resetPasswordTempCode: null,
      ...overrides,
    };
  }

  generateEmail(): string {
    return `user-${Date.now()}-${process.hrtime()[1]}@example.com`;
  }

  generateName(): string {
    return `User${Date.now()}`;
  }

  generatePassword(): string {
    return '12345';
  }

  generateBanned(kind: UserKind): boolean {
    return kind === 'banned';
  }

  generateConfirmEmailTempCode(kind: UserKind): string {
    if (kind === 'email_not_verified') {
      return uuid();
    }

    return null;
  }
}
