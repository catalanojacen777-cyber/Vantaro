// Ordered, append-only migrations. Never edit a shipped migration; add a new one.
export const migrations: { id: string; sql: string }[] = [
  {
    id: '001_init',
    sql: `
-- Vantaro initial schema. Timestamps are ISO-8601 UTC strings.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE sessions (
  id_hash     TEXT PRIMARY KEY,           -- sha256 of the cookie token
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  user_agent  TEXT
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE password_resets (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE workspaces (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE memberships (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('owner','editor','viewer')),
  created_at   TEXT NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX memberships_user ON memberships(user_id);

-- The business brief. One active brief per workspace, edited over time.
CREATE TABLE business_profiles (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data         TEXT NOT NULL DEFAULT '{}',   -- JSON
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','complete')),
  step         INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX business_profiles_ws ON business_profiles(workspace_id);

CREATE TABLE strategies (
  id                  TEXT PRIMARY KEY,
  workspace_id        TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  business_profile_id TEXT REFERENCES business_profiles(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  brief_snapshot      TEXT NOT NULL,          -- JSON copy of the brief used
  status              TEXT NOT NULL DEFAULT 'generating'
                      CHECK (status IN ('generating','ready','partial','failed')),
  generation_mode     TEXT NOT NULL CHECK (generation_mode IN ('live','preview')),
  persona_count       INTEGER NOT NULL DEFAULT 3,
  archived_at         TEXT,
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX strategies_ws ON strategies(workspace_id, archived_at);

CREATE TABLE strategy_sections (
  id           TEXT PRIMARY KEY,
  strategy_id  TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,
  position     INTEGER NOT NULL,
  content      TEXT,                          -- JSON, null until generated
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','generating','ready','failed')),
  edited       INTEGER NOT NULL DEFAULT 0,    -- user has edited since generation
  revision     INTEGER NOT NULL DEFAULT 0,    -- optimistic concurrency counter
  mode         TEXT CHECK (mode IN ('live','preview')),
  error        TEXT,
  updated_at   TEXT NOT NULL,
  UNIQUE (strategy_id, key)
);

CREATE TABLE strategy_versions (
  id          TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  snapshot    TEXT NOT NULL,                  -- JSON of all sections
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX strategy_versions_s ON strategy_versions(strategy_id, created_at);

CREATE TABLE personas (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_id  TEXT REFERENCES strategies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  data         TEXT NOT NULL,                 -- JSON
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX personas_ws ON personas(workspace_id);

CREATE TABLE generation_jobs (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL CHECK (kind IN ('strategy','section','tool','import')),
  workspace_id     TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
  anon_id          TEXT,
  tool_slug        TEXT,
  strategy_id      TEXT REFERENCES strategies(id) ON DELETE CASCADE,
  section_key      TEXT,
  idempotency_key  TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  mode             TEXT NOT NULL CHECK (mode IN ('live','preview')),
  prompt_version   TEXT NOT NULL,
  input            TEXT NOT NULL,             -- JSON
  output           TEXT,                      -- JSON
  progress         TEXT,                      -- JSON {step,total,label}
  error_code       TEXT,
  error_message    TEXT,
  cancel_requested INTEGER NOT NULL DEFAULT 0,
  usage_event_id   TEXT,
  created_at       TEXT NOT NULL,
  started_at       TEXT,
  finished_at      TEXT,
  UNIQUE (idempotency_key)
);
CREATE INDEX generation_jobs_ws ON generation_jobs(workspace_id, created_at);
CREATE INDEX generation_jobs_status ON generation_jobs(status);

CREATE TABLE outputs (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tool_slug    TEXT NOT NULL,
  title        TEXT NOT NULL,
  input        TEXT NOT NULL,
  output       TEXT NOT NULL,
  mode         TEXT NOT NULL CHECK (mode IN ('live','preview','calculated')),
  job_id       TEXT,
  created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL
);
CREATE INDEX outputs_ws ON outputs(workspace_id, created_at);

CREATE TABLE tasks (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_id  TEXT REFERENCES strategies(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  detail       TEXT,
  channel      TEXT,
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','done')),
  due_date     TEXT,
  position     REAL NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX tasks_ws ON tasks(workspace_id, status, position);

CREATE TABLE share_links (
  id          TEXT PRIMARY KEY,
  token_hash  TEXT NOT NULL UNIQUE,
  strategy_id TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at  TEXT,
  revoked_at  TEXT,
  created_at  TEXT NOT NULL,
  last_viewed_at TEXT
);

CREATE TABLE purchases (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider           TEXT NOT NULL,
  checkout_session_id TEXT UNIQUE,
  payment_intent_id  TEXT,
  status             TEXT NOT NULL CHECK (status IN ('pending','paid','refunded','disputed','failed','expired')),
  amount             INTEGER,
  currency           TEXT,
  livemode           INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX purchases_user ON purchases(user_id);

CREATE TABLE entitlements (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL CHECK (plan IN ('paid')),
  purchase_id TEXT REFERENCES purchases(id) ON DELETE SET NULL,
  livemode    INTEGER NOT NULL DEFAULT 0,
  granted_at  TEXT NOT NULL,
  revoked_at  TEXT,
  revoke_reason TEXT
);
CREATE INDEX entitlements_user ON entitlements(user_id);

CREATE TABLE webhook_events (
  id           TEXT PRIMARY KEY,               -- provider event id
  provider     TEXT NOT NULL,
  type         TEXT NOT NULL,
  received_at  TEXT NOT NULL,
  processed_at TEXT
);

-- Quota ledger. A row is reserved before a model call, then finalized or released.
CREATE TABLE usage_events (
  id          TEXT PRIMARY KEY,
  subject     TEXT NOT NULL,                  -- 'user:<id>' | 'anon:<id>' | 'ip:<hash>'
  subject2    TEXT,                           -- secondary subject (ip hash for anonymous)
  kind        TEXT NOT NULL CHECK (kind IN ('generation','strategy')),
  status      TEXT NOT NULL CHECK (status IN ('reserved','finalized','released')),
  job_id      TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX usage_subject ON usage_events(subject, kind, created_at);
CREATE INDEX usage_subject2 ON usage_events(subject2, kind, created_at);

CREATE TABLE support_requests (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  topic       TEXT NOT NULL,
  message     TEXT NOT NULL,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  delivery    TEXT NOT NULL CHECK (delivery IN ('stored','emailed','email_failed')),
  ip_hash     TEXT,
  created_at  TEXT NOT NULL
);

-- Generic fixed-window rate limiting for auth and forms.
CREATE TABLE rate_limits (
  key         TEXT PRIMARY KEY,
  count       INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);

-- First-party, privacy-conscious product events (no user content).
CREATE TABLE analytics_events (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  props       TEXT,                           -- JSON, whitelisted keys only
  subject     TEXT,                           -- hashed
  is_test     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE INDEX analytics_name ON analytics_events(name, created_at);
`,
  },
  {
    id: '002_assistant',
    sql: `
-- Contextual assistant: explain or suggest revisions to a saved strategy.
-- generation_jobs is rebuilt to allow the new 'assist' job kind (SQLite cannot
-- alter a CHECK constraint in place). No other table references it.
CREATE TABLE generation_jobs_new (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL CHECK (kind IN ('strategy','section','tool','import','assist')),
  workspace_id     TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
  anon_id          TEXT,
  tool_slug        TEXT,
  strategy_id      TEXT REFERENCES strategies(id) ON DELETE CASCADE,
  section_key      TEXT,
  idempotency_key  TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  mode             TEXT NOT NULL CHECK (mode IN ('live','preview')),
  prompt_version   TEXT NOT NULL,
  input            TEXT NOT NULL,
  output           TEXT,
  progress         TEXT,
  error_code       TEXT,
  error_message    TEXT,
  cancel_requested INTEGER NOT NULL DEFAULT 0,
  usage_event_id   TEXT,
  created_at       TEXT NOT NULL,
  started_at       TEXT,
  finished_at      TEXT,
  UNIQUE (idempotency_key)
);
INSERT INTO generation_jobs_new SELECT id, kind, workspace_id, user_id, anon_id, tool_slug, strategy_id, section_key, idempotency_key,
  status, mode, prompt_version, input, output, progress, error_code, error_message, cancel_requested, usage_event_id, created_at, started_at, finished_at
  FROM generation_jobs;
DROP TABLE generation_jobs;
ALTER TABLE generation_jobs_new RENAME TO generation_jobs;
CREATE INDEX generation_jobs_ws ON generation_jobs(workspace_id, created_at);
CREATE INDEX generation_jobs_status ON generation_jobs(status);
CREATE INDEX generation_jobs_strategy ON generation_jobs(strategy_id, status);

CREATE TABLE assistant_messages (
  id            TEXT PRIMARY KEY,
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_id   TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  section_key   TEXT,                         -- null = the whole strategy
  intent        TEXT NOT NULL CHECK (intent IN ('explain','revise')),
  question      TEXT NOT NULL,
  job_id        TEXT,
  status        TEXT NOT NULL CHECK (status IN ('pending','answered','failed')),
  answer        TEXT,                         -- JSON, validated against the intent's schema
  mode          TEXT CHECK (mode IN ('live','preview')),
  error         TEXT,
  base_revision INTEGER,                      -- section revision a suggested revision was based on
  applied_at    TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX assistant_messages_s ON assistant_messages(strategy_id, created_at);
`,
  },
];
