import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloader/base.loader';
import { GroupService } from '../../group/group.service';
import { ContactService } from '../contact.service';
import { Contact } from '../entity/contact.entity';

@Injectable({ scope: Scope.REQUEST })
export class ContactsByUserIdLoader extends BaseLoader<number, Contact[]> {
  constructor(
    private contactService: ContactService,
    private groupService: GroupService,
  ) {
    super();
  }

  protected async loaderFn(userIds: number[]): Promise<Contact[][]> {
    const contacts = await this.contactService.listActiveByUserIds(userIds);
    const contactsByUserId = this.groupService.groupBy(contacts, 'sourceUserId');

    return userIds.map((userId) => contactsByUserId.get(userId) || []);
  }
}
