import config from './app.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TagModule } from './tag/tag.module';
import { DatabaseModule } from './database/database.module';
import { ItemModule } from './item/item.module';
import { ItemTagModule } from './item-tag/item-tag.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    DatabaseModule,
    TagModule,
    ItemModule,
    ItemTagModule,
    PaymentModule,
  ],
})
export class AppModule {}