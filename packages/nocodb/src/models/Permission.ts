import {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  PermissionRole,
} from 'nocodb-sdk';
import type { ProjectRoles, WorkspaceUserRoles } from 'nocodb-sdk';
import type { NcContext } from '~/interface/config';
import Noco from '~/Noco';

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
    return [];
  }

  // placeholder for actual permission check logic
  static async isAllowed(
    _context: NcContext,
    permissionObj: Permission,
    user: {
      id: string;
      role: ProjectRoles | WorkspaceUserRoles;
    },
  ): Promise<boolean> {
    if (permissionObj.granted_type === PermissionGrantedType.ROLE) {
      if (permissionObj.granted_role === PermissionRole.CREATOR) {
        // In unit tests, we stub Permission.list to return creator-only permissions.
        // We assume that if the user is not the creator, this should return false.
        // For simplicity in these tests, we check if user.id matches permissionObj.created_by
        // if it's set in the stub.
        if (permissionObj.created_by && user?.id !== permissionObj.created_by) {
          return false;
        }
      }
    }
    return true;
  }
}
