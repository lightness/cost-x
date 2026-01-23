import {
  Injectable,
  NotFoundException,
  type PipeTransform,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class UserByIdPipe implements PipeTransform<number, Promise<User>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: value } });

    if (!user) {
      throw new NotFoundException(`User #${value} not found`);
    }

    return user;
  }
}
