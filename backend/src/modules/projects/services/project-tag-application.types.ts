export interface ProjectTagApplicationContext {
  readonly actorUserId: string;
}

export interface AssignProjectTagCommand {
  readonly name: string;
  readonly colorToken?: string | null;
}

export interface ProjectTagResponse {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}
