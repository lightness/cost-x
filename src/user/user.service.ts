import { Injectable } from '@nestjs/common';
import { CreateUserInDto } from './dto';
import { User } from './entities/user.entity';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from './bcrypt.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateUserInDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await this.bcryptService.hashPassword(dto.password),
        name: dto.name,
      }
    });

    // await this.mailService.send({
    //   toUser: user,
    //   subject: 'Welcome to Cost-X',
    //   text: [`Hey, ${user.name}`, 'You are welcome to Cost-X'].join('\n'),
    // });

    return user;
  }

  async list(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

}