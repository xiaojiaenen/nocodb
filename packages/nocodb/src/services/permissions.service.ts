import { Injectable } from '@nestjs/common';
import {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  PermissionRole,
  PermissionOptionValue,
} from 'nocodb-sdk';
import type { NcContext, NcRequest } from '~/interface/config';
import Permission from '~/models/Permission';
import { NcError } from '~/helpers/catchError';

@Injectable()
export class PermissionsService {
  async list(
    context: NcContext,
    baseId: string,
    filters?: {
      entity?: PermissionEntity;
      entity_id?: string;
      permission?: PermissionKey;
    },
  ) {
    const list = await Permission.list(context, baseId);

    if (!filters) return list;

    return list.filter((p) => {
      if (filters.entity && p.entity !== filters.entity) return false;
      if (filters.entity_id && p.entity_id !== filters.entity_id) return false;
      if (filters.permission && p.permission !== filters.permission) return false;
      return true;
    });
  }

  async get(
    context: NcContext,
    baseId: string,
    {
      entity,
      entityId,
      permission,
    }: { entity: PermissionEntity; entityId: string; permission: PermissionKey },
  ) {
    return await Permission.get(context, baseId, {
      entity,
      entity_id: entityId,
      permission,
    });
  }

  async upsert(
    context: NcContext,
    baseId: string,
    {
      entity,
      entityId,
      permission,
      body,
      req,
    }: {
      entity: PermissionEntity;
      entityId: string;
      permission: PermissionKey;
      body: any;
      req: NcRequest;
    },
  ) {
    const grantedType = body?.granted_type as PermissionGrantedType | string;
    const enforce_for_form =
      body?.enforce_for_form === undefined ? true : !!body.enforce_for_form;
    const enforce_for_automation =
      body?.enforce_for_automation === undefined
        ? true
        : !!body.enforce_for_automation;

    if (!Object.values(PermissionGrantedType).includes(grantedType as any)) {
      NcError.badRequest('Invalid granted_type');
    }

    const granted_role =
      (body?.granted_role as PermissionRole | string | undefined) ?? null;
    if (grantedType === PermissionGrantedType.ROLE && !granted_role) {
      NcError.badRequest('Missing granted_role');
    }

    const subjects = Array.isArray(body?.subjects) ? body.subjects : [];
    if (
      grantedType === PermissionGrantedType.USER &&
      subjects.some((s) => !s?.id)
    ) {
      NcError.badRequest('Invalid subjects');
    }

    (context as any).__permissionsLoaded = false;
    context.permissions = [];

    return await Permission.upsert(
      context,
      baseId,
      {
        entity,
        entity_id: entityId,
        permission,
        granted_type: grantedType as any,
        granted_role:
          grantedType === PermissionGrantedType.ROLE ? (granted_role as any) : null,
        enforce_for_form,
        enforce_for_automation,
        subjects,
      } as any,
      req.user?.id,
    );
  }

  async bulkUpsert(
    context: NcContext,
    baseId: string,
    items: Array<{
      entity: PermissionEntity;
      entityId: string;
      permission: PermissionKey;
      value: PermissionOptionValue;
      userIds?: string[];
    }>,
    req: NcRequest,
  ) {
    (context as any).__permissionsLoaded = false;
    context.permissions = [];

    // Process items in parallel batches to improve performance
    const BATCH_SIZE = 10;
    const results = [];
    
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const { entity, entityId, permission, value, userIds } = item;

          let grantedType: PermissionGrantedType;
          let grantedRole: PermissionRole | null = null;
          let subjects: any[] = [];
          let shouldDelete = false;

          switch (value) {
            case PermissionOptionValue.NOBODY:
              grantedType = PermissionGrantedType.NOBODY;
              break;
            case PermissionOptionValue.SPECIFIC_USERS:
              grantedType = PermissionGrantedType.USER;
              subjects = (userIds || []).map((id) => ({ id, type: 'user' }));
              break;
            case PermissionOptionValue.EVERYONE:
              if (permission === PermissionKey.TABLE_VISIBILITY) {
                shouldDelete = true;
              } else {
                grantedType = PermissionGrantedType.ROLE;
                grantedRole = PermissionRole.VIEWER;
              }
              break;
            case PermissionOptionValue.VIEWERS_AND_UP:
              grantedType = PermissionGrantedType.ROLE;
              grantedRole = PermissionRole.VIEWER;
              break;
            case PermissionOptionValue.COMMENTERS_AND_UP:
              grantedType = PermissionGrantedType.ROLE;
              grantedRole = PermissionRole.COMMENTER;
              break;
            case PermissionOptionValue.EDITORS_AND_UP:
              grantedType = PermissionGrantedType.ROLE;
              grantedRole = PermissionRole.EDITOR;
              break;
            case PermissionOptionValue.CREATORS_AND_UP:
              grantedType = PermissionGrantedType.ROLE;
              grantedRole = PermissionRole.CREATOR;
              break;
            default:
              return null;
          }

          if (shouldDelete) {
            await Permission.delete(context, baseId, {
              entity,
              entity_id: entityId,
              permission,
            });
            return { deleted: true };
          } else {
            return await Permission.upsert(
              context,
              baseId,
              {
                entity,
                entity_id: entityId,
                permission,
                granted_type: grantedType!,
                granted_role: grantedRole,
                subjects,
                enforce_for_form: true,
                enforce_for_automation: true,
              } as any,
              req.user?.id,
            );
          }
        })
      );
      results.push(...batchResults);
    }
    
    return results.filter(Boolean);
  }

  async delete(
    context: NcContext,
    baseId: string,
    {
      entity,
      entityId,
      permission,
    }: { entity: PermissionEntity; entityId: string; permission: PermissionKey },
  ) {
    await Permission.delete(context, baseId, {
      entity,
      entity_id: entityId,
      permission,
    });

    (context as any).__permissionsLoaded = false;
    context.permissions = [];

    return true;
  }
}
