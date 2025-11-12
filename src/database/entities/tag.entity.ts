import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TableName } from '../database.constants';
import ItemTag from './item-tag.entity';
import Item from './item.entity';

@ObjectType()
@Entity({ name: TableName.TAG })
class Tag {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @Field()
  @Column({ name: 'title', length: 100 })
  title: string;

  @OneToMany(() => ItemTag, (itemTag) => itemTag.tag)
  itemTags: ItemTag[];

  @Field(() => [Item])
  items: Item[];
}

export default Tag;
