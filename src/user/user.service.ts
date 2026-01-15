import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../password/bcrypt.service';
import { CreateUserInDto, UpdateUserInDto } from './dto';
import { UserStatus } from './entities/user-status.enum';
import { User } from './entities/user.entity';
import { ConfirmEmailService } from '../confirm-email/confirm-email.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private confirmEmailService: ConfirmEmailService,
  ) {}

  async create(dto: CreateUserInDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: await this.bcryptService.hashPassword(dto.password),
        name: dto.name,
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
      where: { id },
      data: {
        email: dto.email.toLowerCase(),
        password: await this.bcryptService.hashPassword(dto.password),
        name: dto.name,
        status: isNewEmail ? UserStatus.EMAIL_NOT_VERIFIED : user.status,
        tempCode: isNewEmail ? uuid() : user.tempCode,
      },
    });

    if (isNewEmail) {
      await this.confirmEmailService.sendConfirmEmail(updatedUser);
    }

    return updatedUser;
  }

  async list(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async getById(id: number): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
