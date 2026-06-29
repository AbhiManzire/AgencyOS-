export interface CreateCommentValidationInput {
  readonly message: string;
  readonly parentCommentId?: string | null;
}

export interface UpdateCommentValidationInput {
  readonly message?: string;
}
