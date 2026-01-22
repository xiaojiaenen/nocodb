import path from 'path';
import { PassThrough } from 'stream';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { AuditV1OperationTypes, EventType, ncIsNull } from 'nocodb-sdk';
import slash from 'slash';
import { getBase64FileSize } from 'src/helpers/stringHelpers';
import type { DataUpdatePayload, NcContext } from 'nocodb-sdk';
import type {
  AttachmentBase64UploadParam,
} from '~/types/data-columns/attachment';
import { NC_ATTACHMENT_FIELD_SIZE } from '~/constants';
import {
  validateNumberOfFilesInCell,
} from '~/helpers/attachmentHelpers';
import { _wherePk, getBaseModelSqlFromModelId } from '~/helpers/dbHelpers';
import { NcError } from '~/helpers/ncError';
import NcPluginMgrv2 from '~/helpers/NcPluginMgrv2';
import { JobTypes } from '~/interface/Jobs';
import { Audit, FileReference, PresignedUrl } from '~/models';
import { IJobsService } from '~/modules/jobs/jobs-service.interface';
import { DataV3Service } from '~/services/v3/data-v3.service';
import { extractColsMetaForAudit, generateAuditV1Payload } from '~/utils';
import { supportsThumbnails } from '~/utils/attachmentUtils';
import { RootScopes } from '~/utils/globals';
import NocoSocket from '~/socket/NocoSocket';

// ref: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html - extended with some more characters
const normalizeFilename = (filename: string) => {
  return filename.replace(/[\\/:*?"<>'`#|%~{}[\]^]/g, '_');
};

const mb = 1024 * 1024;

@Injectable()
export class DataAttachmentV3Service {
  constructor(
    @Inject(forwardRef(() => 'JobsService'))
    private readonly jobsService: IJobsService,
    private readonly dataV3Service: DataV3Service,
  ) {}
  logger = new Logger(DataAttachmentV3Service.name);

  async appendBase64AttachmentToCellData(param: AttachmentBase64UploadParam) {
    const { context, modelId, columnId, recordId, scope, attachment, req } =
      param;

    // Calculate file size from base64 value
    const fileSize = getBase64FileSize(attachment.file);

    if (fileSize > NC_ATTACHMENT_FIELD_SIZE) {
      NcError.get(context).invalidRequestBody(
        `Attachment is larger than maximum allowed size at ${(
          NC_ATTACHMENT_FIELD_SIZE / mb
        ).toFixed(2)} mb`,
      );
    }

    const baseModel = await getBaseModelSqlFromModelId({
      context: context,
      modelId: modelId,
    });
    await baseModel.model.getColumns(context);
    const column = baseModel.model.columns.find((col) => col.id === columnId);

    // Check if column exists in model
    if (!column) {
      NcError.get(context).fieldNotFound(columnId);
    }

    // Get the row data
    const rowData = await baseModel
      .dbDriver(baseModel.getTnPath(baseModel.model))
      .where(await _wherePk(baseModel.model.primaryKeys, recordId, true))
      .first();

    if (!rowData) {
      NcError.get(context).recordNotFound(recordId);
    }

    if (!attachment.contentType || !attachment.file || !attachment.filename) {
      NcError.get(context).invalidRequestBody(
        `Field contentType, file and filename is required`,
      );
    }

    // Update the cell field using baseModel.dbDriver directly
    const currentAttachments = rowData[column.column_name]
      ? JSON.parse(rowData[column.column_name])
      : [];
    await validateNumberOfFilesInCell(
      context,
      currentAttachments.length + 1,
      column,
    );

    const processedAttachments = [];
    const generateThumbnailAttachments = [];

    try {
      const storageAdapter = await NcPluginMgrv2.storageAdapter();
      const mimeType = attachment.contentType.split(';')[0].trim();

      let filename = attachment.filename;
      filename = scope
        ? `${normalizeFilename(path.parse(filename).name)}${path.extname(
            filename,
          )}`
        : `${normalizeFilename(path.parse(filename).name)}_${nanoid(
            5,
          )}${path.extname(filename)}`;

      const filePath = path.join(
        ...[context.workspace_id, context.base_id, modelId, column.id].filter(
          (k) => k,
        ),
      );
      const destPath = path.join('nc', scope ?? 'uploads', filePath);

      const resultAttachmentUrl = await storageAdapter.fileCreateByStream(
        slash(path.join(destPath, filename)),
        new PassThrough().end(attachment.file, 'base64'),
      );

      const attachmentId = await FileReference.insert(context, {
        storage: storageAdapter.name,
        file_url:
          resultAttachmentUrl ?? path.join('download', filePath, filename),
        file_size: fileSize,
        fk_user_id: context?.user?.id ?? 'anonymous',
        source_id: baseModel.model.source_id,
        fk_model_id: modelId,
        fk_column_id: column.id,
        is_external: !(await baseModel.getSource()).isMeta(),
      });

      const processedAttachment = {
        id: attachmentId, // Generate a new ID for the attachment
        url: ncIsNull(resultAttachmentUrl) ? undefined : resultAttachmentUrl,
        path: ncIsNull(resultAttachmentUrl)
          ? path.join('download', filePath, filename)
          : undefined,
        title: filename,
        mimetype: mimeType,
        size: fileSize,
      };
      processedAttachments.push(processedAttachment);
      if (supportsThumbnails({ mimetype: mimeType })) {
        generateThumbnailAttachments.push(processedAttachment);
      }
    } catch (error) {
      this.logger.error(`${error?.constructor?.name}: ${error?.message}`);
      NcError.get(context).unprocessableEntity(
        `Failed to process base64 attachment`,
      );
    }

    const updatedAttachments = [...currentAttachments, ...processedAttachments];

    await baseModel
      .dbDriver(baseModel.getTnPath(baseModel.model))
      .update({
        [column.column_name]: JSON.stringify(updatedAttachments),
      })
      .where(_wherePk(baseModel.model.primaryKeys, recordId, true));

    if (generateThumbnailAttachments.length > 0) {
      await this.jobsService.add(JobTypes.ThumbnailGenerator, {
        context: {
          base_id: RootScopes.ROOT,
          workspace_id: RootScopes.ROOT,
        },
        attachments: generateThumbnailAttachments,
        scope,
      });
    }

    await baseModel.updateLastModified({
      rowIds: [recordId],
      cookie: { user: context.user },
      baseModel,
      knex: baseModel.dbDriver,
      model: baseModel.model,
      updatedColIds: [column.id],
    });

    await Audit.insert(
      await generateAuditV1Payload<DataUpdatePayload>(
        AuditV1OperationTypes.DATA_UPDATE,
        {
          context: context,
          row_id: recordId,
          fk_model_id: baseModel.model.id,
          fk_workspace_id: context.workspace_id,
          base_id: context.base_id,
          source_id: baseModel.model.source_id,
          details: {
            table_title: baseModel.model.title,
            column_meta: extractColsMetaForAudit([column], {
              [column.title]: updatedAttachments,
            }),
            data: { [column.title]: updatedAttachments },
            old_data: {
              [column.title]: currentAttachments,
            },
          },
          req: req ?? ({ user: context.user } as any),
        },
      ),
    );

    return await this.dataV3Service.dataRead(context, {
      modelId,
      query: '',
      req: { context, user: context.user } as any,
      rowId: recordId,
    });
  }

}
