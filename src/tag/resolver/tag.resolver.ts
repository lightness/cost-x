import { Query, Resolver } from '@nestjs/graphql';
import Tag from '../entities/tag.entity';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { Access } from '../../access/decorator/access.decorator';
import { AccessScope } from '../../access/interfaces';
import { UserRole } from '../../user/entities/user-role.enum';
import { User } from '../../user/entities/user.entity';
import { TagService } from '../tag.service';

@Resolver(() => Tag)
export class TagResolver {
  constructor(private tagService: TagService) {}

  @Query(() => [Tag])
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.USER, UserRole.ADMIN] },
  ])
  async tags(@CurrentUser() currentUser: User): Promise<Tag[]> {
    return this.tagService.list(currentUser.id);
  }

}