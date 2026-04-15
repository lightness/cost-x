const asInteger = (env: string | undefined, defaultValue: number) => {
  return env ? parseInt(env, 10) : defaultValue;
};

export default () => ({
  authenticate: {
    access: {
      jwt: {
        expiresIn: process.env.ACCESS_JWT_EXPIRES_IN || '180min',
        redisPrefix: process.env.ACCESS_JWT_REDIS_PREFIX || 'expired:access:',
        secret: process.env.ACCESS_JWT_SECRET || 'AccessTopSecret',
      },
    },
    refresh: {
      jwt: {
        expiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '181min',
        redisPrefix: process.env.REFRESH_JWT_REDIS_PREFIX || 'expired:refresh:',
        secret: process.env.REFRESH_JWT_SECRET || 'RefreshTopSecret',
      },
    },
  },
  confirmEmail: {
    jwt: {
      expiresIn: process.env.CONFIRM_EMAIL_JWT_EXPIRES_IN || '7d',
      redisPrefix: process.env.CONFIRM_EMAIL_JWT_REDIS_PREFIX || 'expired:confirm-email:',
      secret: process.env.CONFIRM_EMAIL_JWT_SECRET || 'TopSECRET',
    },
    linkUrl: process.env.CONFIRM_EMAIL_LINK_URL,
    strategy: process.env.CONFIRM_EMAIL_STRATEGY || 'manual',
  },
  db: {
    logQuery: true,
    url: process.env.DATABASE_URL,
  },
  emailInvite: {
    jwt: {
      expiresIn: process.env.EMAIL_INVITE_JWT_EXPIRES_IN || '7d',
      redisPrefix: process.env.EMAIL_INVITE_JWT_REDIS_PREFIX || 'expired:email-invite:',
      secret: process.env.EMAIL_INVITE_JWT_SECRET || 'EmailInviteTopSecret',
    },
    linkUrl: process.env.EMAIL_INVITE_LINK_URL,
    rejectLinkUrl: process.env.EMAIL_INVITE_REJECT_LINK_URL,
  },
  graphql: {
    logTime: true,
    writeSchema: process.env.GRAPHQL_WRITE_SCHEMA !== 'false',
  },
  port: asInteger(process.env.PORT, 8080),
  redis: {
    logQuery: true,
    url: process.env.REDIS_URL,
  },
  resetPassword: {
    jwt: {
      expiresIn: process.env.RESET_PASSWORD_JWT_EXPIRES_IN || '5min',
      redisPrefix: process.env.RESET_PASSWORD_JWT_REDIS_PREFIX || 'expired:reset-password:',
      secret: process.env.RESET_PASSWORD_JWT_SECRET || 'ResetPasswordTopSecret',
    },
    linkUrl: process.env.RESET_PASSWORD_LINK_URL,
  },
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: asInteger(process.env.SMTP_PORT, 1025),
    stub: process.env.SMTP_STUB === 'true',
    sender: {
      email: process.env.SENDER_EMAIL || 'no-reply@cost-x.local',
      name: 'Cost-X',
    },
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
});
