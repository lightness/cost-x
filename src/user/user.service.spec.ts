import { Test, TestingModule } from '@nestjs/testing';
import { FactoryModule } from '../../test/factory/factory.module';
import { TestConfigModule } from '../../test/test-config.module';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInDto } from './dto';
import { UserModule } from './user.module';
import { UserService } from './user.service';

describe(UserService.name, () => {
  let moduleRef: TestingModule;
  let service: UserService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, FactoryModule, UserModule],
    }).compile();

    service = moduleRef.get(UserService);
    prisma = moduleRef.get(PrismaService);

    const mailService = moduleRef.get(MailService);
    jest.spyOn(mailService, 'send').mockImplementation(async () => {});
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe(`create`, () => {
    it(`creates a new user`, async () => {
      const inDto: CreateUserInDto = {
        email: 'vasya@gmail.com',
        name: 'Vasya',
        password: '12345',
      };

      await service.create(inDto);

      const savedUser = await prisma.user.findFirst({ where: { email: inDto.email } });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(inDto.email);
      expect(savedUser.name).toBe(inDto.name);
      expect(savedUser.password).toBeDefined();
    });
  });
});
