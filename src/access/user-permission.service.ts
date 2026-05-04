import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPermission } from './entity/user-permission.entity';

@Injectable()
export class UserPermissionService {
  constructor(private prisma: PrismaService) {}

  async listByUserId(userId: number): Promise<UserPermission[]> {
    return this.prisma.userPermission.findMany({ where: { userId } });
  }
}
