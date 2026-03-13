import type { DatabaseSchemaModule } from '../schema.types'

export const USERS_TABLE = 'users'

export const usersSchema: DatabaseSchemaModule = {
  key: 'users',
  description: 'Application users migrated from Firestore and managed in PostgreSQL.',
  statements: [
    `create table if not exists ${USERS_TABLE} (
      id text primary key,

      display_name text not null default '',
      email text not null,
      role text not null default '',
      status text not null default '',

      created_at timestamptz not null default now(),
      created_by text not null default '',

      last_login timestamptz,
      last_password_reset timestamptz,

      updated_at timestamptz not null default now(),
      updated_by text not null default '',

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `create unique index if not exists idx_users_email_unique
      on ${USERS_TABLE} (email);`,

    `create index if not exists idx_users_role
      on ${USERS_TABLE} (role);`,

    `create index if not exists idx_users_status
      on ${USERS_TABLE} (status);`,

    `drop trigger if exists trg_users_manage_timestamps
      on ${USERS_TABLE};`,

    `create trigger trg_users_manage_timestamps
      before insert or update on ${USERS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}