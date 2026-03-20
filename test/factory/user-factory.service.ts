import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserStatus } from '../../generated/prisma/enums';
import { UserCreateInput, UserCreateManyInput } from '../../generated/prisma/models';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User } from '../../src/user/entity/user.entity';
import { KindBasedFactoryService } from './base-factory.service';

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

  async generate(
    kind: UserKind = 'active',
    overrides: Partial<UserCreateManyInput> = {},
  ): Promise<UserCreateInput> {
    return {
      email: this.generateEmail(),
      name: this.generateName(),
      password: this.generatePassword(),
      status: this.generateStatus(kind),
      tempCode: this.generateTempCode(kind),
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

  generateStatus(kind: UserKind): UserStatus {
    switch (kind) {
      case 'active':
        return UserStatus.ACTIVE;
      case 'email_not_verified':
        return UserStatus.EMAIL_NOT_VERIFIED;
      case 'banned':
        return UserStatus.BANNED;
    }
  }

  generateTempCode(kind: UserKind): string {
    if (kind === 'email_not_verified') {
      return uuid();
    }

    return null;
  }
}
