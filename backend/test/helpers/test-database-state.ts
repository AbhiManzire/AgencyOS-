import fs from 'node:fs';
import path from 'node:path';

export interface TestDatabaseState {
  readonly databaseUrl: string;
  readonly embedded: boolean;
  readonly databaseDir?: string;
  readonly port?: number;
}

const STATE_FILE = path.join(__dirname, '..', '.test-database-state.json');

export function writeTestDatabaseState(state: TestDatabaseState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8');
}

export function readTestDatabaseState(): TestDatabaseState | undefined {
  if (!fs.existsSync(STATE_FILE)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as TestDatabaseState;
}

export function clearTestDatabaseState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}
