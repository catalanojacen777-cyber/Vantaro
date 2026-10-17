import { __setDbForTests, openDb } from '@/lib/db';
import { createWorkspace } from '@/lib/auth/session';
import { getDb, now } from '@/lib/db';
import { newId } from '@/lib/ids';

export function freshDb() {
  const db = openDb(':memory:');
  __setDbForTests(db);
  return db;
}

export function makeUser(email = `${newId('u')}@example.com`) {
  const id = newId('usr');
  const ts = now();
  getDb().prepare('INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?,?,?,?,?,?)').run(id, email, null, 'x', ts, ts);
  const workspaceId = createWorkspace(id, 'Test workspace');
  return { id, workspaceId };
}

export async function waitFor<T>(fn: () => T | undefined | null | false, timeoutMs = 3000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, 10));
  }
}
