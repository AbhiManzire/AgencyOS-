export interface ClientTagApplicationContext {
  readonly actorUserId: string;
}

export interface AssignClientTagCommand {
  readonly name: string;
  readonly colorToken?: string | null;
}

export interface ClientTagResponse {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}
