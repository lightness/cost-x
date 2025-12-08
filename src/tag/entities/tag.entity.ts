import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TableName } from '../../database/database.constants';
import { Item } from '../../database/entities';
import ItemTag from '../../item-tag/entities/item-tag.entity';

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

  @Field()
  @Column({ name: 'color', length: 6, nullable: false, default: 'FFFFFF' })
  color: string;

  @OneToMany(() => ItemTag, (itemTag) => itemTag.tag)
  itemTags: ItemTag[];

  @Field(() => [Item])
  items: Item[];
}

export default Tag;
