export interface LeadTagApplicationContext {
  readonly actorUserId: string;
}

export interface AssignLeadTagCommand {
  readonly name: string;
  readonly colorToken?: string | null;
}

export interface LeadTagResponse {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}
