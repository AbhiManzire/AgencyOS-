export interface CommentAuthor {
  readonly userId: string;
  readonly name: string;
  readonly initials: string;
}

export interface CommentListItem {
  readonly id: string;
  readonly message: string;
  readonly author: CommentAuthor;
  readonly createdAt: string;
  readonly updatedAt: string;
}
