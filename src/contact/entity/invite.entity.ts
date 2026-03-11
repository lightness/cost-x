import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Invite as PrismaInvite } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalar';
import { InviteStatus } from './invite-status.enum';

@ObjectType()
export class Invite implements PrismaInvite {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  inviterId: number;

  @Field(() => Int)
  inviteeId: number;

  @Field(() => InviteStatus)
  status: InviteStatus;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar, { nullable: true })
  reactedAt: Date;
}
