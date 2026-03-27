import { Field, InputType } from '@nestjs/graphql';
import { InviteStatus } from '../entity/invite-status.enum';

@InputType()
export class InvitesFilter {
  @Field(() => InviteStatus, { nullable: true })
  status?: InviteStatus;
}
