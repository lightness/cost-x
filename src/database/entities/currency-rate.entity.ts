import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TableName } from '../database.constants';
import { Currency } from './currency.enum';
import { ColumnNumericTransformer } from '../column-numeric.transformer';

@Entity({ name: TableName.CURRENCY_RATE })
class CurrencyRate {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @Column({ name: 'from_currency', length: 3 })
  fromCurrency: Currency;

  @Column({ name: 'to_currency', length: 3 })
  toCurrency: Currency;

  @Column({ name: 'date', type: 'date' })
  date: Date;

  @Column({ name: 'rate', type: 'decimal', transformer: new ColumnNumericTransformer()  })
  rate: number;
}

export default CurrencyRate;
