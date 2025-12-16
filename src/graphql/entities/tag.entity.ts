import { Field, Int, ObjectType } from '@nestjs/graphql';
import ItemEntity from './item.entity';

@ObjectType()
class TagEntity {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field()
  color: string;

  @Field(() => [ItemEntity])
  items: ItemEntity[];
}

export default TagEntity;
