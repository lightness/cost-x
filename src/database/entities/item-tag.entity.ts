import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, MongoRepository, PrimaryGeneratedColumn, RelationId, Unique, UpdateDateColumn } from 'typeorm';
import { TableName } from '../database.constants';
import Item from './item.entity';
import Tag from './tag.entity';

@Entity({ name: TableName.ITEM_TAG })
@Unique(['itemId', 'tagId'])
class ItemTag {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', select: false })
  updatedAt: Date;

  @ManyToOne(() => Item, (item: Item) => item.itemTags, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @RelationId((itemTag: ItemTag) => itemTag.item)
  @Column({ name: 'item_id', nullable: false })
  itemId: number;

  @ManyToOne(() => Tag, (tag: Tag) => tag.itemTags, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @RelationId((itemTag: ItemTag) => itemTag.tag)
  @Column({ name: 'tag_id', nullable: false })
  tagId: number;
}

export default ItemTag;
