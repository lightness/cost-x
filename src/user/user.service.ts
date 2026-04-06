import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ConfirmEmailService } from '../confirm-email/confirm-email.service';
import { BcryptService } from '../password/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInDto, UpdateUserInDto } from './dto';
import { UserStatus } from './entity/user-status.enum';
import User from './entity/user.entity';
import { UserAlreadyExistsError } from './error/user-already-exists.error';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private confirmEmailService: ConfirmEmailService,
  ) {}

  async create(dto: CreateUserInDto, tx: Prisma.TransactionClient = this.prisma): Promise<User> {
    const email = dto.email.toLowerCase();

    const existingUser = await tx.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const user = await tx.user.create({
      data: {
        email,
        name: dto.name,
        password: await this.bcryptService.hashPassword(dto.password),
        status: UserStatus.EMAIL_NOT_VERIFIED,
      },
    });

    await this.confirmEmailService.runConfirmationProcess(user, tx);

    return user;
  }

  async update(
    id: number,
    dto: UpdateUserInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<User> {
    const user = await tx.user.findUnique({ where: { id } });

    if (!user) {
      throw new BadRequestException(`User #${id} not exists`);
    }

    const isNewEmail = Boolean(dto.email) && user.email !== dto.email;

    const updatedUser = await tx.user.update({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: await this.bcryptService.hashPassword(dto.password),
        status: isNewEmail ? UserStatus.EMAIL_NOT_VERIFIED : user.status,
      },
      where: { id },
    });

    if (isNewEmail) {
      await this.confirmEmailService.runConfirmationProcess(updatedUser);
    }

    return updatedUser;
  }

  async delete(user: User, tx: Prisma.TransactionClient = this.prisma) {
    return tx.user.delete({ where: user });
  }

  async ban(user: User, tx: Prisma.TransactionClient = this.prisma) {
    if (user.status === UserStatus.BANNED) {
      throw new BadRequestException(`User is already banned`);
    }

    return tx.user.update({
      data: {
        status: UserStatus.BANNED,
      },
      where: {
        id: user.id,
      },
    });
  }

  async unban(user: User, tx: Prisma.TransactionClient = this.prisma) {
    if (user.status !== UserStatus.BANNED) {
      throw new BadRequestException(`User is not banned`);
    }

    return tx.user.update({
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
