export interface UploadedFilePayload {
  readonly originalname: string;
  readonly mimetype: string;
  readonly buffer: Buffer;
}
