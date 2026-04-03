import { Field, ObjectType } from '@nestjs/graphql';
import { StringChangeOutDto } from './string-change.out.dto';

@ObjectType()
export class ItemChangesOutDto {
  @Field(() => StringChangeOutDto)
  title: StringChangeOutDto;
}
