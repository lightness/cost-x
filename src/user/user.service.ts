import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ConfirmEmailService } from '../confirm-email/confirm-email.service';
import { BcryptService } from '../password/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInDto, UpdateUserInDto } from './dto';
import { UserStatus } from './entity/user-status.enum';
import { User } from './entity/user.entity';
import { UserAlreadyExistsError } from './error/user-already-exists.error';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private confirmEmailService: ConfirmEmailService,
  ) {}

  async create(dto: CreateUserInDto): Promise<User> {
    const email = dto.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        password: await this.bcryptService.hashPassword(dto.password),
        status: UserStatus.EMAIL_NOT_VERIFIED,
        tempCode: uuid(),
      },
    });

    await this.confirmEmailService.sendConfirmEmail(user);

    return user;
  }

  async update(id: number, dto: UpdateUserInDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new BadRequestException(`User #${id} not exists`);
    }

    const isNewEmail = Boolean(dto.email) && user.email !== dto.email;

    const updatedUser = await this.prisma.user.update({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: await this.bcryptService.hashPassword(dto.password),
        status: isNewEmail ? UserStatus.EMAIL_NOT_VERIFIED : user.status,
        tempCode: isNewEmail ? uuid() : user.tempCode,
      },
      where: { id },
    });

    if (isNewEmail) {
      await this.confirmEmailService.sendConfirmEmail(updatedUser);
    }

    return updatedUser;
  }

  async delete(user: User) {
    return this.prisma.user.delete({ where: user });
  }

  async ban(user: User) {
    if (user.status === UserStatus.BANNED) {
      throw new BadRequestException(`User is already banned`);
    }

    return this.prisma.user.update({
      data: {
        status: UserStatus.BANNED,
      },
      where: {
        id: user.id,
      },
    });
  }

  async unban(user: User) {
    if (user.status !== UserStatus.BANNED) {
      throw new BadRequestException(`User is not banned`);
    }

    return this.prisma.user.update({
      data: {
        status: UserStatus.ACTIVE,
      },
      where: {
        id: user.id,
      },
    });
  }

  async list(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async getById(id: number): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
