import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from './bcrypt.service';
import { CreateUserInDto } from './dto';
import { UserStatus } from './entities/user-status.enum';
import { User } from './entities/user.entity';
import { ConfirmEmailService } from './confirm-email.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private mailService: MailService,
    private confirmEmailService: ConfirmEmailService,
  ) { }

  async create(dto: CreateUserInDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await this.bcryptService.hashPassword(dto.password),
        name: dto.name,
        status: UserStatus.EMAIL_NOT_VERIFIED,
        tempCode: uuid(),
      }
    });

    await this.mailService.sendConfirmEmail(
      user, 
      this.confirmEmailService.createConfirmEmailToken(user),
    );

    return user;
  }

  async list(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

}