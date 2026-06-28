/** Contract for module domain errors (e.g. ClientDomainError). */
export interface DomainErrorContract {
  readonly code: string;
  readonly message: string;
}

export function isDomainError(error: unknown): error is DomainErrorContract & Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return 'code' in error && typeof (error as DomainErrorContract).code === 'string';
}
