export interface DealTagApplicationContext {
  readonly actorUserId: string;
}

export interface AssignDealTagCommand {
  readonly name: string;
  readonly colorToken?: string | null;
}

export interface DealTagResponse {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}
