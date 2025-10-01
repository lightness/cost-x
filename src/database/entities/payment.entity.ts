import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { TableName } from '../database.constants';
import { Currency } from './currency.enum';
import Item from './item.entity';
import { ColumnNumericTransformer } from '../column-numeric.transformer';

@Entity({ name: TableName.PAYMENT })
class Payment {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @Column({ name: 'cost', type: 'decimal', transformer: new ColumnNumericTransformer() })
  cost: number;

  @Column({ name: 'currency', length: 3 })
  currency: Currency;

  @Column({ name: 'date', type: 'date' })
  date: string;

  @ManyToOne(() => Item, (item) => item.payments)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @RelationId((payment: Payment) => payment.item)
  @Column({ name: 'item_id', nullable: false })
  itemId: number;
}

export default Payment;
