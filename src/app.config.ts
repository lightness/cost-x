const asInteger = (env: string | undefined, defaultValue: number) => {
  return env ? parseInt(env, 10) : defaultValue;
};

export default () => ({
  port: asInteger(process.env.PORT, 8080),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: asInteger(process.env.DB_PORT, 3306),
    username: process.env.DB_USER || '',
    password: process.env.DB_PW || '',
    database: process.env.DB_DATABASE || '',
    logging: process.env.DB_LOGGING === 'true',
  },
});
