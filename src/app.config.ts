const asInteger = (env: string | undefined, defaultValue: number) => {
  return env ? parseInt(env, 10) : defaultValue;
};

export default () => ({
  authenticate: {
    access: {
      jwt: {
        expiresIn: '180min',
        redisPrefix: 'expired:access:',
        secret: 'AccessTopSecret',
      },
    },
    refresh: {
      jwt: {
        expiresIn: '181min',
        redisPrefix: 'expired:refresh:',
        secret: 'RefreshTopSecret',
      },
    },
  },
  confirmEmail: {
    jwt: {
      expiresIn: '7d',
      redisPrefix: 'expired:confirm-email:',
      secret: 'TopSECRET',
    },
    linkUrl: process.env.CONFIRM_EMAIL_LINK_URL,
  },
  costCurrency: process.env.COST_CURRENCY || 'USD',
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
      expiresIn: '5min',
      redisPrefix: 'expired:reset-password:',
      secret: 'ResetPasswordTopSecret',
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
