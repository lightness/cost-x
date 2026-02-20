import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UserStatus } from '../generated/prisma/enums';
import { AuthModule } from '../src/auth/auth.module';
import { AuthInDto } from '../src/auth/dto';
import { JwtPayload } from '../src/auth/interfaces';
import { ACCESS_TOKEN_SERVICE } from '../src/auth/symbols';
import { configureApp } from '../src/configure-app';
import { BcryptService } from '../src/password/bcrypt.service';
import { PasswordModule } from '../src/password/password.module';
import { TokenService } from '../src/token/token.service';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { TestConfigModule } from './test-config.module';

describe('Auth E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let userFactory: UserFactoryService;
  let bcryptService: BcryptService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, FactoryModule, PasswordModule, AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    userFactory = moduleRef.get(UserFactoryService);
    bcryptService = moduleRef.get(BcryptService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`POST /auth/login`, () => {
    let authInDto: AuthInDto;
    let userId: number;

    beforeAll(async () => {
      const password = userFactory.generatePassword();
      const user = await userFactory.create({
        password: await bcryptService.hashPassword(password),
        status: UserStatus.ACTIVE,
        tempCode: null,
      });
      authInDto = {
        email: user.email,
        password,
      };
      userId = user.id;
    });

    it('should return access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authInDto)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.accessToken).toEqual(expect.any(String));
    });

    it('should return jwt as access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authInDto)
        .set('Content-Type', 'application/json');

      const accessTokenService = moduleRef.get<TokenService<JwtPayload>>(ACCESS_TOKEN_SERVICE);

      await expect(
        accessTokenService.verifyToken(response.body.accessToken),
      ).resolves.not.toThrow();

      await expect(accessTokenService.verifyToken(response.body.accessToken)).resolves.toEqual(
        expect.objectContaining({
          id: userId,
        }),
      );
    });

    it('should set refresh token in cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(authInDto)
        .set('Content-Type', 'application/json');

      const cookies = response.headers['set-cookie'];

      const refreshTokenCookieRegexp =
        /^refreshToken_refresh-token=[^.]+\.[^.]+\.[^.]+; Path=\/auth\/refresh-token; Expires=[^;]+; HttpOnly; Secure; SameSite=Strict$/;
      const logoutCookieRegexp =
        /^refreshToken_logout=[^.]+\.[^.]+\.[^.]+; Path=\/auth\/logout; Expires=[^;]+; HttpOnly; Secure; SameSite=Strict$/;

      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringMatching(refreshTokenCookieRegexp),
          expect.stringMatching(logoutCookieRegexp),
        ]),
      );
    });
  });
});
