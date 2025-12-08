import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from 'typeorm';
import { Currency } from '../../currency-rate/entities/currency.enum';
import { ColumnNumericTransformer } from '../../database/column-numeric.transformer';
import { TableName } from '../../database/database.constants';
import { DateTransformer } from '../../database/date.transformer';
import Item from '../../item/entities/item.entity';
import { DateIsoScalar, DateScalar } from '../../graphql/scalars';

@ObjectType()
@Entity({ name: TableName.PAYMENT })
class Payment {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Field(() => DateIsoScalar, { nullable: true })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @Field(() => DateIsoScalar, { nullable: true })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  @Column({ name: 'title', nullable: true })
  title: string;

  @Field(() => Float)
  @Column({ name: 'cost', type: 'decimal', transformer: new ColumnNumericTransformer() })
  cost: number;

  @Field(() => Currency)
  @Column({ name: 'currency', length: 3 })
  currency: Currency;

  @Field(() => DateScalar)
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
