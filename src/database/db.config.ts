import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as entities from './entities';
import { CommonNamingStrategy } from './common.naming-strategy';

dotenv.config();

// NOTE: This DataSource is ONLY for running migrations locally!

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true',
  entities,
  migrationsRun: false,
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migration',
  migrationsTransactionMode: 'each',
  namingStrategy: new CommonNamingStrategy(),
});

dataSource.initialize();

export default dataSource;
