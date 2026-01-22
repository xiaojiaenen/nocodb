import { expect } from 'chai';
import 'mocha';
import request from 'supertest';
import {
  PermissionEntity,
  PermissionGrantedType,
  PermissionKey,
  ProjectRoles,
  UITypes,
} from 'nocodb-sdk';
import init from '../../init';
import { createProject } from '../../factory/base';
import { createUser } from '../../factory/user';
import { createTable } from '../../factory/table';

export default function () {
  describe('Permissions meta API', () => {
    it('Sets field edit permission for specific users', async () => {
      const context = await init();
      const base = await createProject(context);
      const table = await createTable(context, base, {
        table_name: 'permissions_table',
        title: 'Permissions Table',
        columns: [
          { title: 'Title', uidt: UITypes.SingleLineText },
          { title: 'Secret', uidt: UITypes.SingleLineText },
        ],
      });

      const columns = await table.getColumns({
        workspace_id: base.fk_workspace_id,
        base_id: base.id,
      });
      const secretCol = columns.find((c) => c.title === 'Secret');
      expect(secretCol?.id).to.be.a('string');

      const userA = await createUser(
        { app: context.app },
        { email: 'perm_user_a@example.com' },
      );
      const userB = await createUser(
        { app: context.app },
        { email: 'perm_user_b@example.com' },
      );

      await request(context.app)
        .post(`/api/v2/meta/bases/${base.id}/users`)
        .set('xc-auth', context.token)
        .send({ email: userA.user.email, roles: ProjectRoles.EDITOR })
        .expect(200);
      await request(context.app)
        .post(`/api/v2/meta/bases/${base.id}/users`)
        .set('xc-auth', context.token)
        .send({ email: userB.user.email, roles: ProjectRoles.EDITOR })
        .expect(200);

      const userAToken = userA.token;
      const userBToken = userB.token;

      await request(context.app)
        .put(
          `/api/v2/meta/bases/${base.id}/permissions/${PermissionEntity.FIELD}/${secretCol.id}/${PermissionKey.RECORD_FIELD_EDIT}`,
        )
        .set('xc-auth', context.token)
        .send({
          granted_type: PermissionGrantedType.USER,
          subjects: [{ type: 'user', id: userA.user.id }],
        })
        .expect(200);

      const fetched = (
        await request(context.app)
          .get(
            `/api/v2/meta/bases/${base.id}/permissions/${PermissionEntity.FIELD}/${secretCol.id}/${PermissionKey.RECORD_FIELD_EDIT}`,
          )
          .set('xc-auth', context.token)
          .expect(200)
      ).body;
      expect(fetched.permission).to.equal(PermissionKey.RECORD_FIELD_EDIT);
      expect(fetched.entity).to.equal(PermissionEntity.FIELD);
      expect(fetched.entity_id).to.equal(secretCol.id);
      expect(fetched.granted_type).to.equal(PermissionGrantedType.USER);
      expect(fetched.subjects?.length).to.equal(1);

      await request(context.app)
        .put(
          `/api/v2/meta/bases/${base.id}/permissions/${PermissionEntity.FIELD}/${secretCol.id}/${PermissionKey.RECORD_FIELD_EDIT}`,
        )
        .set('xc-auth', userBToken)
        .send({
          granted_type: PermissionGrantedType.USER,
          subjects: [{ type: 'user', id: userB.user.id }],
        })
        .expect(403);

      await request(context.app)
        .post(`/api/v3/data/${base.id}/${table.id}/records`)
        .set('xc-auth', userAToken)
        .send({ fields: { Title: 'ok', Secret: 'allowed' } })
        .expect(200);

      await request(context.app)
        .post(`/api/v3/data/${base.id}/${table.id}/records`)
        .set('xc-auth', userBToken)
        .send({ fields: { Title: 'no', Secret: 'blocked' } })
        .expect(403);
    });
  });
}
