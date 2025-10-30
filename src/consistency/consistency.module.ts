import { Module } from '@nestjs/common';
import { ConsistencyService } from './consistency.service';

@Module({
  imports: [],
  providers: [ConsistencyService],
  exports: [ConsistencyService],
})
export class ConsistencyModule {}