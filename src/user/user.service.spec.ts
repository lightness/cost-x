import { Test, TestingModule } from '@nestjs/testing';
import { FactoryModule } from '../../test/factory/factory.module';
import { UserFactoryService } from '../../test/factory/user-factory.service';
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
  let userFactory: UserFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, FactoryModule, UserModule],
    }).compile();

    service = moduleRef.get(UserService);
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);

    const mailService = moduleRef.get(MailService);
    jest.spyOn(mailService, 'send').mockImplementation(async () => {});
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe(`create`, () => {
    it(`creates a new user`, async () => {
      const input: CreateUserInDto = {
        email: userFactory.generateEmail(),
        name: userFactory.generateName(),
        password: userFactory.generatePassword(),
      };

      const { id } = await service.create(input);

      const savedUser = await prisma.user.findUnique({ where: { id } });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(input.email);
      expect(savedUser.name).toBe(input.name);
      expect(savedUser.password).toBeDefined();
    });

    it('saves email in lowercase', async () => {
      const input: CreateUserInDto = {
        email: userFactory.generateEmail().toUpperCase(),
        name: userFactory.generateName(),
        password: userFactory.generatePassword(),
      };

      const { id } = await service.create(input);

      const savedUser = await prisma.user.findUnique({ where: { id } });
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe(input.email.toLocaleLowerCase());
    });
  });
});
