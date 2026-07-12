export const AI_PROVIDER_ERROR_CODES = {
  NOT_CONFIGURED: 'AI_PROVIDER_NOT_CONFIGURED',
} as const;

export type AiProviderErrorCode =
  (typeof AI_PROVIDER_ERROR_CODES)[keyof typeof AI_PROVIDER_ERROR_CODES];

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode;

  constructor(code: AiProviderErrorCode, message: string) {
    super(message);
    this.name = 'AiProviderError';
    this.code = code;
  }
}
