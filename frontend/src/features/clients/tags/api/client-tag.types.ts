export interface ClientTagRecord {
  readonly id: string;
  readonly name: string;
  readonly colorToken: string | null;
  readonly description: string | null;
  readonly assignedAt: string;
}

export interface AssignClientTagPayload {
  readonly name: string;
  readonly colorToken?: string | null;
}
