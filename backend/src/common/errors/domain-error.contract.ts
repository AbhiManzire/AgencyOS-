/** Contract for module domain errors (e.g. ClientDomainError). */
export interface DomainErrorContract {
  readonly code: string;
  readonly message: string;
}

export function isDomainError(error: unknown): error is DomainErrorContract & Error {
  if (!(error instanceof Error)) {
    return false;
  }

  if (!('code' in error) || typeof (error as DomainErrorContract).code !== 'string') {
    return false;
  }

  const code = (error as DomainErrorContract).code;
  // PrismaClientKnownRequestError also has a string `code` (P2002, P2003, …).
  // Those must not be treated as domain errors (would incorrectly map to 422).
  if (/^P\d{4}$/.test(code)) {
    return false;
  }

  return true;
}
