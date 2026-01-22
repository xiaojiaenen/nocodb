import {
  PermissionGrantedType,
  PermissionRoleMap,
  PermissionRolePower,
} from 'nocodb-sdk';
import { nanoid } from 'nanoid';
import type {
  PermissionEntity,
  PermissionKey,
  PermissionRole,
  ProjectRoles,
  WorkspaceUserRoles,
} from 'nocodb-sdk';
import type { NcContext } from '~/interface/config';
import Noco from '~/Noco';
import { MetaTable } from '~/utils/globals';

export default class Permission {
  id: string;
  fk_workspace_id: string;
  base_id: string;
  entity: PermissionEntity;
  entity_id: string;
  permission: PermissionKey;
  created_by: string;
  enforce_for_form: boolean;
  enforce_for_automation: boolean;
  granted_type: PermissionGrantedType;
  granted_role: PermissionRole;

  subjects?: {
    type: 'user' | 'team';
    id: string;
  }[];

  constructor(permission: Permission) {
    Object.assign(this, permission);
  }
  public static async list(
    context: NcContext,
    baseId: string,
    _ncMeta = Noco.ncMeta,
  ): Promise<Permission[]> {
    if ((context as any).__permissionsLoaded && baseId === context.base_id) {
      return context.permissions.map((p) => new Permission(p as any));
    }

    const permissions = await _ncMeta.metaList2(
      context.workspace_id,
      baseId,
      MetaTable.PERMISSIONS,
    );

    const permissionIds = permissions.map((p) => p.id).filter(Boolean);

    let subjects: any[] = [];
    if (permissionIds.length) {
      subjects = await _ncMeta.metaList2(
        context.workspace_id,
        baseId,
        MetaTable.PERMISSION_SUBJECTS,
        {
          xcCondition: { fk_permission_id: { in: permissionIds } },
        },
      );
    }

    const subjectsByPermissionId = subjects.reduce((acc, s) => {
      const list = acc.get(s.fk_permission_id) ?? [];
      list.push(s);
      acc.set(s.fk_permission_id, list);
      return acc;
    }, new Map<string, any[]>());

    const list = permissions.map((p) => {
      const permission = new Permission(p);
      const permissionSubjects = subjectsByPermissionId.get(permission.id) ?? [];
      permission.subjects = permissionSubjects.map((s) => ({
        type: s.subject_type === 'group' ? 'team' : s.subject_type,
        id: s.subject_id,
      }));
      return permission;
    });

    if (baseId === context.base_id) {
      context.permissions = list as any;
      (context as any).__permissionsLoaded = true;
    }

    return list;
  }

  static async isAllowed(
    _context: NcContext,
    _permissionObj: Permission,
    _user: {
      id: string;
      role: ProjectRoles | WorkspaceUserRoles;
    },
  ): Promise<boolean> {
    const grantedType = (_permissionObj as any)?.granted_type;
    if (
      grantedType === PermissionGrantedType.NOBODY ||
      grantedType === 'no_one'
    ) {
      return false;
    }

    if (grantedType === PermissionGrantedType.USER || grantedType === 'user') {
      const subjects = _permissionObj.subjects ?? [];
      return subjects.some((s) => s.type === 'user' && s.id === _user.id);
    }

    if (grantedType === PermissionGrantedType.ROLE || grantedType === 'role') {
      const userPermissionRole = (PermissionRoleMap as any)[_user.role];
      const requiredRole = (_permissionObj as any)?.granted_role as PermissionRole;

      const userPower = (PermissionRolePower as any)[userPermissionRole] ?? 0;
      const requiredPower = (PermissionRolePower as any)[requiredRole] ?? 0;

      return userPower >= requiredPower && requiredPower > 0;
    }

    return false;
  }

  public static async get(
    context: NcContext,
    baseId: string,
    {
      entity,
      entity_id,
      permission,
    }: { entity: PermissionEntity; entity_id: string; permission: PermissionKey },
    _ncMeta = Noco.ncMeta,
  ): Promise<Permission | null> {
    const list = await _ncMeta.metaList2(
      context.workspace_id,
      baseId,
      MetaTable.PERMISSIONS,
      { condition: { entity, entity_id, permission } },
    );
    const row = list?.[0];
    if (!row?.id) return null;

    const subjects = await _ncMeta.metaList2(
      context.workspace_id,
      baseId,
      MetaTable.PERMISSION_SUBJECTS,
      { condition: { fk_permission_id: row.id } },
    );

    const permissionObj = new Permission(row as any);
    permissionObj.subjects = (subjects ?? []).map((s) => ({
      type: s.subject_type === 'group' ? 'team' : s.subject_type,
      id: s.subject_id,
    }));
    return permissionObj;
  }

  public static async upsert(
    context: NcContext,
    baseId: string,
    permissionObj: Partial<Permission> & {
      entity: PermissionEntity;
      entity_id: string;
      permission: PermissionKey;
      granted_type: PermissionGrantedType;
      subjects?: { type: 'user' | 'team'; id: string }[];
    },
    createdBy?: string,
    _ncMeta = Noco.ncMeta,
  ): Promise<Permission> {
    const existing = await _ncMeta.metaList2(
      context.workspace_id,
      baseId,
      MetaTable.PERMISSIONS,
      {
        condition: {
          entity: permissionObj.entity,
          entity_id: permissionObj.entity_id,
          permission: permissionObj.permission,
        },
      },
    );
    const existingRow = existing?.[0];

    const enforce_for_form =
      permissionObj.enforce_for_form === undefined
        ? true
        : !!permissionObj.enforce_for_form;
    const enforce_for_automation =
      permissionObj.enforce_for_automation === undefined
        ? true
        : !!permissionObj.enforce_for_automation;

    const toWrite: any = {
      entity: permissionObj.entity,
      entity_id: permissionObj.entity_id,
      permission: permissionObj.permission,
      enforce_for_form,
      enforce_for_automation,
      granted_type: permissionObj.granted_type,
      granted_role:
        permissionObj.granted_type === PermissionGrantedType.ROLE
          ? permissionObj.granted_role
          : null,
    };

    let id: string;
    if (existingRow?.id) {
      id = existingRow.id;
      await _ncMeta.metaUpdate(
        context.workspace_id,
        baseId,
        MetaTable.PERMISSIONS,
        toWrite,
        id,
      );
    } else {
      id = nanoid(20);
      await _ncMeta.metaInsert2(
        context.workspace_id,
        baseId,
        MetaTable.PERMISSIONS,
        { id, ...toWrite, created_by: createdBy },
        true,
      );
    }

    await _ncMeta.metaDelete(
      context.workspace_id,
      baseId,
      MetaTable.PERMISSION_SUBJECTS,
      { fk_permission_id: id },
    );

    if (
      permissionObj.granted_type === PermissionGrantedType.USER &&
      permissionObj.subjects?.length
    ) {
      await Promise.all(
        permissionObj.subjects.map(async (s) => {
          await _ncMeta.metaInsert2(
            context.workspace_id,
            baseId,
            MetaTable.PERMISSION_SUBJECTS,
            {
              fk_permission_id: id,
              subject_type: s.type === 'team' ? 'group' : 'user',
              subject_id: s.id,
            },
            true,
          );
        }),
      );
    }

    return (await this.get(
      context,
      baseId,
      {
        entity: permissionObj.entity,
        entity_id: permissionObj.entity_id,
        permission: permissionObj.permission,
      },
      _ncMeta,
    )) as Permission;
  }

  public static async delete(
    context: NcContext,
    baseId: string,
    {
      entity,
      entity_id,
      permission,
    }: { entity: PermissionEntity; entity_id: string; permission: PermissionKey },
    _ncMeta = Noco.ncMeta,
  ): Promise<boolean> {
    const existing = await this.get(
      context,
      baseId,
      { entity, entity_id, permission },
      _ncMeta,
    );
    if (!existing?.id) return true;

    await _ncMeta.metaDelete(
      context.workspace_id,
      baseId,
      MetaTable.PERMISSION_SUBJECTS,
      { fk_permission_id: existing.id },
    );
    await _ncMeta.metaDelete(context.workspace_id, baseId, MetaTable.PERMISSIONS, {
      id: existing.id,
    });
    return true;
  }
}
