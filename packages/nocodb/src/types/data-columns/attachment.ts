import type { NcContext, NcRequest, PublicAttachmentScope } from 'nocodb-sdk';

// Attachment data types for v3 API
export interface DataAttachmentRequestId {
  id: string;
}

export type DataAttachmentRequest = DataAttachmentRequestId;

export interface AttachmentBase64UploadParam {
  context: NcContext;
  scope?: PublicAttachmentScope;
  modelId: string;
  columnId: string;
  recordId: string;
  req?: Partial<NcRequest>;
  attachment: {
    contentType: string;
    file: string; // base64-encoded-file-content
    filename: string;
  };
}
