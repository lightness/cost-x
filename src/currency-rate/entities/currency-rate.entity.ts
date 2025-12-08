import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ColumnNumericTransformer } from '../../database/column-numeric.transformer';
import { TableName } from '../../database/database.constants';
import { DateTransformer } from '../../database/date.transformer';
import { DateScalar } from '../../graphql/scalars';
import { Currency } from './currency.enum';

@ObjectType()
@Entity({ name: TableName.CURRENCY_RATE })
class CurrencyRate {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Field(() => Currency)
  @Column({ name: 'from_currency', length: 3 })
  fromCurrency: Currency;

  @Field(() => Currency)
  @Column({ name: 'to_currency', length: 3 })
  toCurrency: Currency;

  @Field(() => DateScalar)
  @Column({ name: 'date', type: 'date', transformer: new DateTransformer() })
  date: Date;

  @Field(() => Float)
  @Column({ name: 'rate', type: 'decimal', transformer: new ColumnNumericTransformer() })
  rate: number;
}

export default CurrencyRate;
