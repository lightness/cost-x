# Plan: Extract `updateWorkspaceDefaultCurrency` Mutation

## Context

`updateWorkspace` currently accepts `WorkspaceInDto` containing both `title` and `defaultCurrency`, and the mutation's access rule only allows workspace owners and admins. The goal is to extract currency into its own dedicated mutation with its own `WorkspacePermission`, following the exact same pattern as `workspace-stake`.

**Correction to the draft:** `WorkspaceInDto` is shared between `createWorkspace` (which must keep `defaultCurrency`) and `updateWorkspace`. Removing `defaultCurrency` from the shared DTO would break workspace creation. The fix is to create a new `WorkspaceUpdateInDto` (title-only) for `updateWorkspace`, leaving `WorkspaceInDto` unchanged for `createWorkspace`.

---

## Change Shape

```
Prisma schema
  └─ add WorkspacePermission.UPDATE_WORKSPACE_DEFAULT_CURRENCY
       └─ migration + client regen

WorkspaceInDto (unchanged — still used by createWorkspace)
WorkspaceUpdateInDto (new, title-only) ──► updateWorkspace mutation
WorkspaceService.update() ─────────────► accepts WorkspaceUpdateInDto, drops defaultCurrency

WorkspaceCurrencyService (new)
  └─ updateDefaultCurrency(workspace, currency, user, tx)
       ├─ tx.workspace.update({ data: { defaultCurrency } })
       └─ emitAsync(WORKSPACE_UPDATED, { old, new, actorId, tx })

WorkspaceCurrencyMutationResolver (new)
  └─ updateWorkspaceDefaultCurrency(workspaceId, defaultCurrency): Workspace
       └─ @Access.allow({ or: [permission, owner, admin] })

WorkspaceCurrencyModule (new) ──► registered in AppModule
```

---

## Step-by-step Changes

### 1. Prisma schema — `prisma/schema.prisma`

Add after `UPDATE_WORKSPACE_STAKE_RULE` (line 156):
```
UPDATE_WORKSPACE_DEFAULT_CURRENCY
```

Then run:
```bash
migration_name=add_update_workspace_default_currency_permission npm run prisma:migration:create
npm run prisma:migration:up
npm run prisma:client:generate
```
Additive enum value — no data migration needed.

### 2. New DTO — `src/workspace/dto/workspace-update.in.dto.ts`

Title-only input type for `updateWorkspace`:
```typescript
@InputType()
export class WorkspaceUpdateInDto {
  @Field(() => String)
  title: string;
}
```

Export from `src/workspace/dto/index.ts` alongside `WorkspaceInDto`.

### 3. WorkspaceService — `src/workspace/workspace.service.ts`

Change `update()` signature to accept `WorkspaceUpdateInDto` and remove `defaultCurrency` from the Prisma call:
```typescript
async update(workspace: Workspace, dto: WorkspaceUpdateInDto, ...): Promise<Workspace> {
  const updatedWorkspace = await tx.workspace.update({
    data: { title: dto.title },   // defaultCurrency removed
    where: { id: workspace.id },
  });
  // event emission unchanged
}
```

### 4. WorkspaceMutationResolver — `src/workspace/resolver/workspace.mutation.resolver.ts`

Change `updateWorkspace` arg type from `WorkspaceInDto` to `WorkspaceUpdateInDto`:
```typescript
async updateWorkspace(
  @Args('id', ...) workspace: Workspace,
  @Args('dto') dto: WorkspaceUpdateInDto,   // was WorkspaceInDto
  ...
```

### 5. New service — `src/workspace-currency/workspace-currency.service.ts`

Mirror `WorkspaceStakeService` exactly, replacing `stakeRule` with `defaultCurrency`:
```typescript
async updateDefaultCurrency(
  workspace: Workspace,
  defaultCurrency: Currency,
  currentUser: User,
  tx: Prisma.TransactionClient = this.prisma,
): Promise<Workspace> {
  const updatedWorkspace = await tx.workspace.update({
    data: { defaultCurrency },
    where: { id: workspace.id },
  });
  await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.WORKSPACE_UPDATED, {
    actorId: currentUser.id,
    newWorkspace: updatedWorkspace,
    oldWorkspace: workspace,
    tx,
  });
  return updatedWorkspace;
}
```

### 6. New resolver — `src/workspace-currency/resolver/workspace-currency.mutation.resolver.ts`

Mirror `WorkspaceStakeMutationResolver`. The `Currency` arg type comes from `../../currency-rate/entity/currency.enum` (same import path used elsewhere in the codebase). Access rule uses the new `UPDATE_WORKSPACE_DEFAULT_CURRENCY` permission:
```typescript
@Mutation(() => Workspace)
@Access.allow({
  or: [
    {
      permission: [WorkspacePermission.UPDATE_WORKSPACE_DEFAULT_CURRENCY],
      scope: AccessScope.WORKSPACE,
      target: 'workspace',
    },
    { owner: 'workspace', scope: AccessScope.WORKSPACE },
    { role: [UserRole.ADMIN], scope: AccessScope.USER },
  ],
})
@Infer('workspace', { from: fromArg('workspaceId'), pipes: [WorkspaceByIdPipe] })
async updateWorkspaceDefaultCurrency(
  @Args('workspaceId', { type: () => Int }, WorkspaceByIdPipe) workspace: Workspace,
  @Args('defaultCurrency', { type: () => Currency }) defaultCurrency: Currency,
  @CurrentUser() currentUser: User,
  @Context('tx') tx: Prisma.TransactionClient,
) {
  return this.workspaceCurrencyService.updateDefaultCurrency(workspace, defaultCurrency, currentUser, tx);
}
```

### 7. New module — `src/workspace-currency/workspace-currency.module.ts`

```typescript
@Module({
  imports: [PrismaModule, AuthModule, AccessModule],
  providers: [WorkspaceCurrencyService, WorkspaceCurrencyMutationResolver],
})
export class WorkspaceCurrencyModule {}
```

### 8. AppModule — `src/app.module.ts`

Add `WorkspaceCurrencyModule` import alongside `WorkspaceStakeModule` (line ~50).

---

## Test Changes

### `test/workspace.e2e.spec.ts`

- Remove `defaultCurrency` from the `updateWorkspaceMutation` GQL selection string (lines 29–37).
- Remove `defaultCurrency` from all `dto` variables passed to `updateWorkspace` (lines 134, 155, 176, 199, 221).
- Remove the assertion `expect(...updateWorkspace.defaultCurrency).toBe(Currency.EUR)` (line 142).
- Leave the `createWorkspace` tests and mutation entirely unchanged — `WorkspaceInDto` still has `defaultCurrency`.

### New `test/workspace-currency.e2e.spec.ts`

Mirror `workspace-stake.e2e.spec.ts`. Module imports: `WorkspaceModule`, `WorkspaceMembershipModule`, `WorkspaceCurrencyModule`, `GraphqlModule`. Test cases:

1. Owner can update default currency
2. Member with `UPDATE_WORKSPACE_DEFAULT_CURRENCY` permission can update
3. Member without the permission gets FORBIDDEN
4. Non-member (stranger) gets FORBIDDEN
5. Unauthenticated request gets FORBIDDEN
6. System admin can update default currency for any workspace

---

## Files Touched

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add enum value |
| `src/workspace/dto/workspace-update.in.dto.ts` | **Create** |
| `src/workspace/dto/index.ts` | Export new DTO |
| `src/workspace/workspace.service.ts` | Accept `WorkspaceUpdateInDto`, drop `defaultCurrency` from `update()` |
| `src/workspace/resolver/workspace.mutation.resolver.ts` | Use `WorkspaceUpdateInDto` in `updateWorkspace` |
| `src/app.module.ts` | Register new module |
| `src/workspace-currency/workspace-currency.module.ts` | **Create** |
| `src/workspace-currency/workspace-currency.service.ts` | **Create** |
| `src/workspace-currency/resolver/workspace-currency.mutation.resolver.ts` | **Create** |
| `test/workspace.e2e.spec.ts` | Remove `defaultCurrency` from `updateWorkspace` tests |
| `test/workspace-currency.e2e.spec.ts` | **Create** |

---

## Verification

```bash
npm run lint:fix
npx jest test/workspace.e2e.spec.ts --verbose        # existing tests still pass
npx jest test/workspace-currency.e2e.spec.ts --verbose  # new tests pass
```
