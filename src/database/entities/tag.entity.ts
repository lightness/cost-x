import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TableName } from '../database.constants';
import ItemTag from './item-tag.entity';

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

  @Column({ name: 'color', length: 6, nullable: false, default: 'FFFFFF' })
  color: string;

  @OneToMany(() => ItemTag, (itemTag) => itemTag.tag)
  itemTags: ItemTag[];
}

export default Tag;
