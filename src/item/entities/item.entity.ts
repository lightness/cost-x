import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TableName } from '../../database/database.constants';
import { Tag } from '../../database/entities';
import { DateIsoScalar } from '../../graphql/scalars';
import ItemTag from '../../item-tag/entities/item-tag.entity';
import { FindPaymentsResponse } from '../../payment/dto';
import Payment from '../../payment/entities/payment.entity';
import { PaymentsAggregation } from '../../payments-aggregation/entities/payments-aggregation.entity';

@ObjectType()
@Entity({ name: TableName.ITEM })
class Item {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Field(() => DateIsoScalar)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Field(() => DateIsoScalar)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Field()
  @Column({ name: 'title', length: 255 })
  title: string;

  @OneToMany(() => ItemTag, (itemTag) => itemTag.item)
  itemTags: ItemTag[];

  @Field(() => [Payment])
  @OneToMany(() => Payment, (payment) => payment.item)
  payments: Payment[];

  @Field(() => PaymentsAggregation)
  paymentsAggregation: PaymentsAggregation;

  @Field(() => [Tag])
  tags: Tag[];
}

export default Item;
