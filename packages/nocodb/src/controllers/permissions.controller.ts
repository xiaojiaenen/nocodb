import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PermissionEntity, PermissionKey } from 'nocodb-sdk';
import { TenantContext } from '~/decorators/tenant-context.decorator';
import { GlobalGuard } from '~/guards/global/global.guard';
import { MetaApiLimiterGuard } from '~/guards/meta-api-limiter.guard';
import { Acl } from '~/middlewares/extract-ids/extract-ids.middleware';
import type { NcContext, NcRequest } from '~/interface/config';
import { PermissionsService } from '~/services/permissions.service';

@Controller()
@UseGuards(MetaApiLimiterGuard, GlobalGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get([
    '/api/v1/db/meta/projects/:baseId/permissions',
    '/api/v2/meta/bases/:baseId/permissions',
  ])
  @Acl('permissionList')
  async list(
    @TenantContext() context: NcContext,
    @Param('baseId') baseId: string,
    @Query('entity') entity?: PermissionEntity,
    @Query('entity_id') entity_id?: string,
    @Query('permission') permission?: PermissionKey,
  ) {
    return await this.permissionsService.list(context, baseId, {
      entity,
      entity_id,
      permission,
    });
  }

  @Post([
    '/api/v1/db/meta/projects/:baseId/permissions',
    '/api/v2/meta/bases/:baseId/permissions',
  ])
  @HttpCode(200)
  @Acl('permissionSet')
  async bulkUpsert(
    @TenantContext() context: NcContext,
    @Param('baseId') baseId: string,
    @Body() body: any[],
    @Req() req: NcRequest,
  ) {
    return await this.permissionsService.bulkUpsert(context, baseId, body, req);
  }

  @Get([
    '/api/v1/db/meta/projects/:baseId/permissions/:entity/:entityId/:permission',
    '/api/v2/meta/bases/:baseId/permissions/:entity/:entityId/:permission',
  ])
  @Acl('permissionGet')
  async get(
    @TenantContext() context: NcContext,
    @Param('baseId') baseId: string,
    @Param('entity') entity: PermissionEntity,
    @Param('entityId') entityId: string,
    @Param('permission') permission: PermissionKey,
  ) {
    return await this.permissionsService.get(context, baseId, {
      entity,
      entityId,
      permission,
    });
  }

  @Put([
    '/api/v1/db/meta/projects/:baseId/permissions/:entity/:entityId/:permission',
    '/api/v2/meta/bases/:baseId/permissions/:entity/:entityId/:permission',
  ])
  @HttpCode(200)
  @Acl('permissionSet')
  async upsert(
    @TenantContext() context: NcContext,
    @Param('baseId') baseId: string,
    @Param('entity') entity: PermissionEntity,
    @Param('entityId') entityId: string,
    @Param('permission') permission: PermissionKey,
    @Body() body: any,
    @Req() req: NcRequest,
  ) {
    return await this.permissionsService.upsert(context, baseId, {
      entity,
      entityId,
      permission,
      body,
      req,
    });
  }

  @Delete([
    '/api/v1/db/meta/projects/:baseId/permissions/:entity/:entityId/:permission',
    '/api/v2/meta/bases/:baseId/permissions/:entity/:entityId/:permission',
  ])
  @HttpCode(200)
  @Acl('permissionDelete')
  async delete(
    @TenantContext() context: NcContext,
    @Param('baseId') baseId: string,
    @Param('entity') entity: PermissionEntity,
    @Param('entityId') entityId: string,
    @Param('permission') permission: PermissionKey,
  ) {
    return await this.permissionsService.delete(context, baseId, {
      entity,
      entityId,
      permission,
    });
  }
}

