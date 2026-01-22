import { expect } from 'chai';
import 'mocha';
import {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  ProjectRoles,
  UITypes,
} from 'nocodb-sdk';
import request from 'supertest';
import { createProject } from '../../../factory/base';
import { createTable } from '../../../factory/table';
import { createUser } from '../../../factory/user';
import init from '../../../init';
import TestDbMngr from '../../../TestDbMngr';
import Noco from '~/Noco';
import Permission from '~/models/Permission';
import { MetaTable } from '~/utils/globals';

describe('dataApiV3', () => {
  describe('field-edit-permissions', () => {
    before(async () => {
      if (!(TestDbMngr as any).metaKnex) {
        await TestDbMngr.init();
      }
    });

    it('Restricts field edit per user without new roles', async () => {
      const context = await init();
      const base = await createProject(context);

      const table = await createTable(context, base, {
        table_name: 'field_perm',
        title: 'field_perm',
        columns: [
          {
            title: 'Sensitive',
            uidt: UITypes.SingleLineText,
          },
          {
            title: 'Normal',
            uidt: UITypes.SingleLineText,
          },
        ],
      });

      const ctx = {
        workspace_id: base.fk_workspace_id,
        base_id: base.id,
      };

      const columns = await table.getColumns(ctx);
      const sensitiveCol = columns.find((c) => c.title === 'Sensitive');
      const normalCol = columns.find((c) => c.title === 'Normal');

      expect(!!sensitiveCol).to.equal(true);
      expect(!!normalCol).to.equal(true);

      const userA = await createUser(
        { app: context.app },
        {
          email: 'field-perm-a@example.com',
          password: 'A1234abh2@dsad',
        },
      );
      const userB = await createUser(
        { app: context.app },
        {
          email: 'field-perm-b@example.com',
          password: 'A1234abh2@dsad',
        },
      );

      await request(context.app)
        .post(`/api/v2/meta/bases/${base.id}/users`)
        .set('xc-token', context.xc_token)
        .send({
          email: userA.user.email,
          roles: ProjectRoles.EDITOR,
        })
        .expect(200);

      await request(context.app)
        .post(`/api/v2/meta/bases/${base.id}/users`)
        .set('xc-token', context.xc_token)
        .send({
          email: userB.user.email,
          roles: ProjectRoles.EDITOR,
        })
        .expect(200);

      const perm = await Noco.ncMeta.metaInsert2(
        base.fk_workspace_id,
        base.id,
        MetaTable.PERMISSIONS,
        {
          entity: PermissionEntity.FIELD,
          entity_id: sensitiveCol.id,
          permission: PermissionKey.RECORD_FIELD_EDIT,
          granted_type: PermissionGrantedType.USER,
          created_by: context.user.id,
          enforce_for_form: true,
          enforce_for_automation: true,
        },
      );

      await Noco.ncMeta.metaInsert2(
        base.fk_workspace_id,
        base.id,
        MetaTable.PERMISSION_SUBJECTS,
        {
          fk_permission_id: perm.id,
          subject_type: 'user',
          subject_id: userA.user.id,
        },
        true,
      );

      const permissions = await Permission.list(
        { ...ctx, api_version: 3 } as any,
        base.id,
      );
      expect(permissions.length).to.equal(1);
      expect(permissions[0].permission).to.equal(PermissionKey.RECORD_FIELD_EDIT);
      expect(permissions[0].entity).to.equal(PermissionEntity.FIELD);
      expect(permissions[0].entity_id).to.equal(sensitiveCol.id);
      expect(
        await Permission.isAllowed(
          { ...ctx, api_version: 3 } as any,
          permissions[0] as any,
          { id: userB.user.id, role: ProjectRoles.EDITOR },
        ),
      ).to.equal(false);

      const inserted = await request(context.app)
        .post(`/api/v3/data/${base.id}/${table.id}/records`)
        .set('xc-auth', context.token)
        .send({
          fields: {
            Sensitive: 's1',
            Normal: 'n1',
          },
        })
        .expect(200);

      const recordId = inserted.body.records?.[0]?.id;
      expect(!!recordId).to.equal(true);

      await request(context.app)
        .patch(`/api/v3/data/${base.id}/${table.id}/records`)
        .set('xc-auth', userA.token)
        .send([
          {
            id: recordId,
            fields: {
              Sensitive: 's2',
            },
          },
        ])
        .expect(200);

      await request(context.app)
        .patch(`/api/v3/data/${base.id}/${table.id}/records`)
        .set('xc-auth', userB.token)
        .send([
          {
            id: recordId,
            fields: {
              Sensitive: 'blocked',
            },
          },
        ])
        .expect(403);

      await request(context.app)
        .patch(`/api/v3/data/${base.id}/${table.id}/records`)
        .set('xc-auth', userB.token)
        .send([
          {
            id: recordId,
            fields: {
              Normal: 'ok',
            },
          },
        ])
        .expect(200);
    });
  });
});
