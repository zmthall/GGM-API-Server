import { DatabaseSchemaModule } from "../schema.types"

export const ADMIN_CORRESPONDENCE_COUNTS_TABLE = 'admin_correspondence_counts'

export const correspondenceCountsSchema: DatabaseSchemaModule = {
  key: 'admin_meta.correspondence_counts',
  description: 'Singleton admin correspondence counters migrated from Firestore admin_meta/correspondence_counts.',
  statements: [
    `create table if not exists ${ADMIN_CORRESPONDENCE_COUNTS_TABLE} (
      id text primary key
        default 'correspondence_counts'
        check (id = 'correspondence_counts'),

      applications_new integer not null default 0
        check (applications_new >= 0),

      messages_new integer not null default 0
        check (messages_new >= 0),

      ride_requests_new integer not null default 0
        check (ride_requests_new >= 0),

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      raw_payload jsonb not null default '{}'::jsonb
    );`,
    `insert into ${ADMIN_CORRESPONDENCE_COUNTS_TABLE} (
      id,
      applications_new,
      messages_new,
      ride_requests_new,
      created_at,
      updated_at,
      raw_payload
    )
    values (
      'correspondence_counts',
      0,
      0,
      0,
      now(),
      now(),
      '{}'::jsonb
    )
    on conflict (id) do nothing;`,
    `drop trigger if exists trg_admin_correspondence_counts_manage_timestamps
      on ${ADMIN_CORRESPONDENCE_COUNTS_TABLE};`,
    `create trigger trg_admin_correspondence_counts_manage_timestamps
      before insert or update on ${ADMIN_CORRESPONDENCE_COUNTS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}