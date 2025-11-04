import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { TableName } from '../database.constants';
import { Currency } from './currency.enum';
import Item from './item.entity';

@ObjectType()
@Entity({ name: TableName.PAYMENT })
class Payment {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @Field({ nullable: true })
  @Column({ name: 'title', nullable: true })
  title: string;

  @Field()
  @Column({ name: 'cost', type: 'decimal', transformer: new ColumnNumericTransformer() })
  cost: number;

  @Field(() => Currency)
  @Column({ name: 'currency', length: 3 })
  currency: Currency;

  @Field()
  @Column({ name: 'date', type: 'date' })
  date: string;

  @Field(() => Item)
  @ManyToOne(() => Item, (item) => item.payments)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @RelationId((payment: Payment) => payment.item)
  @Column({ name: 'item_id', nullable: false })
  itemId: number;
}

export default Payment;
