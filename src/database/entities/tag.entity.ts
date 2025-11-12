import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TableName } from '../database.constants';
import ItemTag from './item-tag.entity';
import Item from './item.entity';

@Entity({ name: TableName.TAG })
class Tag {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @Column({ name: 'title', length: 100 })
  title: string;

  @OneToMany(() => ItemTag, (itemTag) => itemTag.tag)
  itemTags: ItemTag[];
}

export default Tag;
