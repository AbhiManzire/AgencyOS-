import { execSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { clearTestDatabaseState, writeTestDatabaseState } from './helpers/test-database-state';

const DEFAULT_DATABASE_URL =
  'postgresql://agencyos:agencyos_dev@localhost:5432/agencyos?schema=public';

const backendRoot = path.resolve(__dirname, '..');

type TestDatabaseState = import('./helpers/test-database-state').TestDatabaseState;

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to resolve an ephemeral port for embedded PostgreSQL.'));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });

    server.on('error', reject);
  });
}

function probeDatabaseUrl(databaseUrl: string): boolean {
  try {
    execSync('pnpm exec prisma db execute --stdin', {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      input: 'SELECT 1',
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

async function startEmbeddedPostgres(): Promise<TestDatabaseState> {
  const databaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agencyos-e2e-pg-'));
  const port = await getAvailablePort();
  const user = 'agencyos';
  const password = 'agencyos_dev';
  const database = 'agencyos';

  const pg = new EmbeddedPostgres({
    databaseDir,
    port,
    user,
    password,
    persistent: false,
  });

  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase(database);
  } catch (error) {
    await pg.stop().catch(() => undefined);
    fs.rmSync(databaseDir, { recursive: true, force: true });
    throw error;
  }

  return {
    databaseUrl: `postgresql://${user}:${password}@127.0.0.1:${String(port)}/${database}?schema=public`,
    embedded: true,
    databaseDir,
    port,
  };
}

export default async function globalSetup(): Promise<void> {
  clearTestDatabaseState();

  const configuredUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

  if (probeDatabaseUrl(configuredUrl)) {
    writeTestDatabaseState({
      databaseUrl: configuredUrl,
      embedded: false,
    });
    return;
  }

  const embeddedState = await startEmbeddedPostgres();
  writeTestDatabaseState(embeddedState);
}
