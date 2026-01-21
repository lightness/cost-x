const asInteger = (env: string | undefined, defaultValue: number) => {
  return env ? parseInt(env, 10) : defaultValue;
};

export default () => ({
  port: asInteger(process.env.PORT, 8080),
  db: {
    url: process.env.DATABASE_URL,
    logQuery: false,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  costCurrency: process.env.COST_CURRENCY || 'USD',
  spreadsheet: {
    id: '1oFQIOD0OfztKcVdTntcU9IQ-uM8oAVL3yD9b7cahma4',
    name: 'Затраты на строительство',
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar',
    ],
    columnNames: ['title', 'date', 'bynCost', 'usdCost', 'eurCost'],
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
    confirmEmail: {
      linkUrl: process.env.CONFIRM_EMAIL_LINK_URL,
      jwt: {
        secret: 'TopSECRET',
        expiresIn: '7d',
        redisPrefix: 'expired:confirm-email:',
      },
    },
  },
  authenticate: {
    access: {
      jwt: {
        secret: 'AccessTopSecret',
        expiresIn: '180min',
        redisPrefix: 'expired:access:',
      },
    },
    refresh: {
      jwt: {
        secret: 'RefreshTopSecret',
        expiresIn: '181min',
        redisPrefix: 'expired:refresh:',
      },
    },
  },
});
