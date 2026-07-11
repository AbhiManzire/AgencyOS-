export interface AssignTaskTagCommand {
  readonly name: string;
  readonly colorToken?: string | null;
}

export interface TaskTagApplicationContext {
  readonly actorUserId: string;
}

export interface TaskTagResponse {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}
