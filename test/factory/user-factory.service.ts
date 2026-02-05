import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { UserStatus } from '../../generated/prisma/enums';
import { UserCreateInput } from '../../generated/prisma/models';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User } from '../../src/user/entity/user.entity';
import { BaseFactoryService } from './base-factory.service';

@Injectable()
export class UserFactoryService implements BaseFactoryService<User, UserCreateInput> {
  constructor(private prisma: PrismaService) {}

  create(overrides: UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...this.generate(),
        ...overrides,
      },
    });
  }

  generate(): UserCreateInput {
    return {
      email: this.generateEmail(),
      name: this.generateName(),
      password: this.generatePassword(),
      status: UserStatus.EMAIL_NOT_VERIFIED,
      tempCode: this.generateTempCode(),
    };
  }

  generateEmail(): string {
    return `user-${Date.now()}@example.com`;
  }

  generateName(): string {
    return `User${Date.now()}`;
  }

  generatePassword(): string {
    return '12345';
  }

  generateTempCode(): string {
    return uuid();
  }
}
