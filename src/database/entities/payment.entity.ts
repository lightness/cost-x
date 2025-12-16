import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { TableName } from '../database.constants';
import { DateTransformer } from '../date.transformer';
import { Currency } from './currency.enum';
import Item from './item.entity';

@Entity({ name: TableName.PAYMENT })
class Payment {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @Column({ name: 'title', nullable: true })
  title: string;

  @Column({ name: 'cost', type: 'decimal', transformer: new ColumnNumericTransformer() })
  cost: number;

  @Column({ name: 'currency', length: 3 })
  currency: Currency;

  @Column({ name: 'date', type: 'date', transformer: new DateTransformer() })
  date: Date;

  @ManyToOne(() => Item, (item) => item.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @RelationId((payment: Payment) => payment.item)
  @Column({ name: 'item_id', nullable: false })
  itemId: number;
}

export default Payment;
