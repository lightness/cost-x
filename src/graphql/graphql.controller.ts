import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Controller('graphql')
export class GraphqlController {
  private readonly schema = readFileSync(join(process.cwd(), 'src/graphql/schema.gql'), 'utf-8');

  @Get('schema')
  getSchema(@Res() res: Response): void {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(this.schema);
  }
}
