import type { DatabaseSchemaModule } from '../schema.types'

export const EVENTS_TABLE = 'events'

export const eventsSchema: DatabaseSchemaModule = {
  key: 'events',
  description: 'Public/community events migrated from Firestore.',
  statements: [
    `create table if not exists ${EVENTS_TABLE} (
      id text primary key,

      address text not null default '',
      archived boolean not null default false,
      date_start timestamptz,
      date_end timestamptz,
      description text not null default '',
      link text not null default '',
      location text not null default '',
      title text not null default '',

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `create index if not exists idx_events_archived
      on ${EVENTS_TABLE} (archived);`,

    `create index if not exists idx_events_date_start
      on ${EVENTS_TABLE} (date_start desc);`,

    `drop trigger if exists trg_events_manage_timestamps
      on ${EVENTS_TABLE};`,

    `create trigger trg_events_manage_timestamps
      before insert or update on ${EVENTS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}