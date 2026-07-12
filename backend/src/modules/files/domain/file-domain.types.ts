export interface UploadFileValidationInput {
  readonly buffer: Buffer | undefined;
  readonly maxFileSizeBytes: number;
  readonly mimeType?: string;
  readonly allowedMimeTypes?: readonly string[];
  readonly originalName?: string;
  readonly allowedExtensions?: readonly string[];
}
