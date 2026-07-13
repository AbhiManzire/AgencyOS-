export const CLIENT_SUCCESS_ERROR_CODES = {
  DEAL_NOT_FOUND: 'DEAL_NOT_FOUND',
  DEAL_NOT_WON: 'DEAL_NOT_WON',
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  MERGE_SAME_CLIENT: 'MERGE_SAME_CLIENT',
  MERGE_TARGET_ARCHIVED: 'MERGE_TARGET_ARCHIVED',
  MERGE_SOURCE_ARCHIVED: 'MERGE_SOURCE_ARCHIVED',
  RENEWAL_NOT_FOUND: 'RENEWAL_NOT_FOUND',
  ACTIVE_REQUIRES_WON_DEAL: 'ACTIVE_REQUIRES_WON_DEAL',
  CLIENT_ALREADY_MERGED: 'CLIENT_ALREADY_MERGED',
} as const;

export type ClientSuccessErrorCode =
  (typeof CLIENT_SUCCESS_ERROR_CODES)[keyof typeof CLIENT_SUCCESS_ERROR_CODES];

export class ClientSuccessError extends Error {
  readonly code: ClientSuccessErrorCode;

  constructor(code: ClientSuccessErrorCode, message: string) {
    super(message);
    this.name = 'ClientSuccessError';
    this.code = code;
  }
}
