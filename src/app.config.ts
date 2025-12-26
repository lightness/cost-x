const asInteger = (env: string | undefined, defaultValue: number) => {
  return env ? parseInt(env, 10) : defaultValue;
};

export default () => ({
  port: asInteger(process.env.PORT, 8080),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: asInteger(process.env.DB_PORT, 3306),
    username: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || '',
    logging: process.env.DB_LOGGING === 'true',
    url: process.env.DATABASE_URL,
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
    columnNames: [
      'title',
      'date',
      'bynCost',
      'usdCost',
      'eurCost',
    ]
  }
});
