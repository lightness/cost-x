import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ConfirmEmailService } from '../confirm-email/confirm-email.service';
import { BcryptService } from '../password/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInDto, UpdateUserInDto } from './dto';
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
      },
    });

    return this.confirmEmailService.runConfirmationProcess(user, tx);
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
      },
      where: { id },
    });

    if (isNewEmail) {
      return this.confirmEmailService.runConfirmationProcess(updatedUser, tx);
    }

    return updatedUser;
  }

  async delete(user: User, tx: Prisma.TransactionClient = this.prisma) {
    return tx.user.delete({ where: user });
  }

  async ban(user: User, tx: Prisma.TransactionClient = this.prisma) {
    if (user.isBanned) {
      throw new BadRequestException(`User is already banned`);
    }

    return tx.user.update({
      data: {
        isBanned: true,
      },
      where: {
        id: user.id,
      },
    });
  }

  async unban(user: User, tx: Prisma.TransactionClient = this.prisma) {
    if (!user.isBanned) {
      throw new BadRequestException(`User is not banned`);
    }

    return tx.user.update({
      data: {
        isBanned: false,
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
