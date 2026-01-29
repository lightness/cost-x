import { InputType } from '@nestjs/graphql';
import { AssignTagInDto } from './assign-tag.in.dto';

@InputType()
export class UnassignTagInDto extends AssignTagInDto {}
