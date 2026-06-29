export interface UploadFileValidationInput {
  readonly buffer: Buffer | undefined;
  readonly maxFileSizeBytes: number;
}
