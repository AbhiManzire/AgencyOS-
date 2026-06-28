import fs from 'node:fs';
import EmbeddedPostgres from 'embedded-postgres';
import { clearTestDatabaseState, readTestDatabaseState } from './helpers/test-database-state';

export default async function globalTeardown(): Promise<void> {
  const state = readTestDatabaseState();

  if (state?.embedded && state.databaseDir && state.port !== undefined) {
    const pg = new EmbeddedPostgres({
      databaseDir: state.databaseDir,
      port: state.port,
      persistent: false,
    });

    try {
      await pg.stop();
    } finally {
      try {
        fs.rmSync(state.databaseDir, { recursive: true, force: true });
      } catch {
        // Windows may retain file handles briefly after pg.stop().
      }
    }
  }

  clearTestDatabaseState();
}
