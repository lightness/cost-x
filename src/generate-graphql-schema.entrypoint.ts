import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { ItemResolver } from './graphql/item.resolver';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function generateSchema() {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule);
  await app.init();

  const gqlSchemaFactory = app.get(GraphQLSchemaFactory);
  const schema = await gqlSchemaFactory.create([ItemResolver]);
  console.log(printSchema(schema));
}

generateSchema();
