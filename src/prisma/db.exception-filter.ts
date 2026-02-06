import { ArgumentsHost, BadRequestException, Catch } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class DbExceptionFilter {
  get regex(): RegExp {
    return /.*Unique constraint failed on the fields: \((.*)\)/;
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, _: ArgumentsHost) {
    if (exception.code === 'P2002') {
      const [_, fields] = this.regex.exec(exception.message);
      const cleanFields = fields.replace(/`/g, '');

      throw new BadRequestException(`Field(s) (${cleanFields}) must be unique`);
    }
  }
}
