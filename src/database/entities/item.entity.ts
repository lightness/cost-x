import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TableName } from '../database.constants';
import ItemTag from './item-tag.entity';
import Payment from './payment.entity';
import Tag from './tag.entity';

@Entity({ name: TableName.ITEM })
class Item {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @Column({ name: 'title', length: 255 })
  title: string;

  @OneToMany(() => ItemTag, (itemTag) => itemTag.item)
  itemTags: ItemTag[];

  @OneToMany(() => Payment, (payment) => payment.item)
  payments: Payment[];

  @ManyToMany(() => Tag, (tag) => tag.items)
  @JoinTable({
    name: TableName.ITEM_TAG,
    joinColumn: { name: 'item_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags: Tag[];
}

export default Item;
