export interface LeadTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}

export interface AssignLeadTagPayload {
  readonly name: string;
  readonly colorToken?: string | null;
}
