import { bool, cleanEnv, num, str } from 'envalid';

export default () => {
  const env = cleanEnv(process.env, {
    ACCESS_JWT_EXPIRES_IN: str({ default: '180min' }),
    ACCESS_JWT_REDIS_PREFIX: str({ default: 'expired:access:' }),
    ACCESS_JWT_SECRET: str({ default: 'AccessTopSecret' }),

    CONFIRM_EMAIL_JWT_EXPIRES_IN: str({ default: '7d' }),
    CONFIRM_EMAIL_JWT_REDIS_PREFIX: str({ default: 'expired:confirm-email:' }),
    CONFIRM_EMAIL_JWT_SECRET: str({ default: 'TopSECRET' }),
    CONFIRM_EMAIL_LINK_URL: str({ default: undefined }),
    CONFIRM_EMAIL_STRATEGY: str({ default: 'manual' }),

    DATABASE_LOG_QUERY: bool({ default: true }),
    DATABASE_URL: str(),

    EMAIL_INVITE_JWT_EXPIRES_IN: str({ default: '7d' }),
    EMAIL_INVITE_JWT_REDIS_PREFIX: str({ default: 'expired:email-invite:' }),
    EMAIL_INVITE_JWT_SECRET: str({ default: 'EmailInviteTopSecret' }),
    EMAIL_INVITE_LINK_URL: str({ default: undefined }),
    EMAIL_INVITE_REJECT_LINK_URL: str({ default: undefined }),

    GRAPHQL_WRITE_SCHEMA: bool({ default: true }),

    PORT: num({ default: 8080 }),

    REDIS_URL: str(),

    REFRESH_JWT_EXPIRES_IN: str({ default: '181min' }),
    REFRESH_JWT_REDIS_PREFIX: str({ default: 'expired:refresh:' }),
    REFRESH_JWT_SECRET: str({ default: 'RefreshTopSecret' }),

    RESET_PASSWORD_JWT_EXPIRES_IN: str({ default: '5min' }),
    RESET_PASSWORD_JWT_REDIS_PREFIX: str({ default: 'expired:reset-password:' }),
    RESET_PASSWORD_JWT_SECRET: str({ default: 'ResetPasswordTopSecret' }),
    RESET_PASSWORD_LINK_URL: str({ default: undefined }),

    SENDER_EMAIL: str({ default: 'no-reply@cost-x.local' }),
    SMTP_HOST: str({ default: 'localhost' }),
    SMTP_PORT: num({ default: 1025 }),
    SMTP_STUB: bool({ default: false }),
  });

  return {
    authenticate: {
      access: {
        jwt: {
          expiresIn: env.ACCESS_JWT_EXPIRES_IN,
          redisPrefix: env.ACCESS_JWT_REDIS_PREFIX,
          secret: env.ACCESS_JWT_SECRET,
        },
      },
      refresh: {
        jwt: {
          expiresIn: env.REFRESH_JWT_EXPIRES_IN,
          redisPrefix: env.REFRESH_JWT_REDIS_PREFIX,
          secret: env.REFRESH_JWT_SECRET,
        },
      },
    },
    confirmEmail: {
      jwt: {
        expiresIn: env.CONFIRM_EMAIL_JWT_EXPIRES_IN,
        redisPrefix: env.CONFIRM_EMAIL_JWT_REDIS_PREFIX,
        secret: env.CONFIRM_EMAIL_JWT_SECRET,
      },
      linkUrl: env.CONFIRM_EMAIL_LINK_URL,
      strategy: env.CONFIRM_EMAIL_STRATEGY,
    },
    db: {
      logQuery: env.DATABASE_LOG_QUERY,
      url: env.DATABASE_URL,
    },
    emailInvite: {
      jwt: {
        expiresIn: env.EMAIL_INVITE_JWT_EXPIRES_IN,
        redisPrefix: env.EMAIL_INVITE_JWT_REDIS_PREFIX,
        secret: env.EMAIL_INVITE_JWT_SECRET,
      },
      linkUrl: env.EMAIL_INVITE_LINK_URL,
      rejectLinkUrl: env.EMAIL_INVITE_REJECT_LINK_URL,
    },
    graphql: {
      logTime: true,
      writeSchema: env.GRAPHQL_WRITE_SCHEMA,
    },
    port: env.PORT,
    redis: {
      logQuery: true,
      url: env.REDIS_URL,
    },
    resetPassword: {
      jwt: {
        expiresIn: env.RESET_PASSWORD_JWT_EXPIRES_IN,
        redisPrefix: env.RESET_PASSWORD_JWT_REDIS_PREFIX,
        secret: env.RESET_PASSWORD_JWT_SECRET,
      },
      linkUrl: env.RESET_PASSWORD_LINK_URL,
    },
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      sender: {
        email: env.SENDER_EMAIL,
        name: 'Cost-X',
      },
      stub: env.SMTP_STUB,
    },
    spreadsheet: {
      columnNames: ['title', 'date', 'bynCost', 'usdCost', 'eurCost'],
      id: '1oFQIOD0OfztKcVdTntcU9IQ-uM8oAVL3yD9b7cahma4',
      name: 'Затраты на строительство',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/calendar',
      ],
    },
  };
};
