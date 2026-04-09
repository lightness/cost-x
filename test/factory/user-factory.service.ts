import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Permission } from '../../generated/prisma/enums';
import { UserCreateInput, UserCreateManyInput } from '../../generated/prisma/models';
import { PrismaService } from '../../src/prisma/prisma.service';
import User from '../../src/user/entity/user.entity';
import { KindBasedFactoryService } from './base-factory.service';

const ALL_PERMISSIONS = Object.values(Permission);

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
    return this.prisma.user.create({
      data: {
        ...(await this.generate(kind, overrides)),
      },
    });
  }

  async createWithPermissions(
    kind: UserKind = 'active',
    permissions: Permission[] = [],
    accessLevel = 1,
  ): Promise<User> {
    const user = await this.create(kind);

    if (permissions.length > 0) {
      await this.prisma.userPermission.createMany({
        data: permissions.map((permission) => ({ userId: user.id, permission, accessLevel })),
      });
    }

    return user;
  }

  async createWithAllPermissions(kind: UserKind = 'active'): Promise<User> {
    const user = await this.create(kind);

    await this.prisma.userPermission.createMany({
      data: ALL_PERMISSIONS.map((permission) => ({ userId: user.id, permission, accessLevel: 3 })),
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
