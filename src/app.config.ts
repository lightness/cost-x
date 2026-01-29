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
      redisPrefix:
        process.env.CONFIRM_EMAIL_JWT_REDIS_PREFIX || 'expired:confirm-email:',
      secret: process.env.CONFIRM_EMAIL_JWT_SECRET || 'TopSECRET',
    },
    linkUrl: process.env.CONFIRM_EMAIL_LINK_URL,
  },
  db: {
    logQuery: false,
    url: process.env.DATABASE_URL,
  },
  graphql: {
    logTime: true,
  },
  mailersend: {
    apiKey: process.env.MAILERSEND_API_KEY,
    sender: {
      email: process.env.SENDER_EMAIL,
      name: 'Cost-X',
    },
  },
  port: asInteger(process.env.PORT, 8080),
  redis: {
    url: process.env.REDIS_URL,
  },
  resetPassword: {
    jwt: {
      expiresIn: process.env.RESET_PASSWORD_JWT_EXPIRES_IN || '5min',
      redisPrefix:
        process.env.RESET_PASSWORD_JWT_REDIS_PREFIX ||
        'expired:reset-password:',
      secret: process.env.RESET_PASSWORD_JWT_SECRET || 'ResetPasswordTopSecret',
    },
    linkUrl: process.env.RESET_PASSWORD_LINK_URL,
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
