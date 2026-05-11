import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Currency, Workspace as PrismaWorkspace } from '../../../generated/prisma/client';
import { StakeRule } from '../../workspace-stake/entity/stake-rule.enum';
import { DateIsoScalar } from '../../graphql/scalar';

@ObjectType()
export class Workspace implements PrismaWorkspace {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field(() => String)
  title: string;

  @Field(() => Int)
  ownerId: number;

  @Field(() => Currency)
  defaultCurrency: Currency;

  @Field(() => StakeRule)
  stakeRule: StakeRule;
}
