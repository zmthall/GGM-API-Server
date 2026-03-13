import { DatabaseSchemaModule } from "../schema.types"

export const BLOG_CALENDARS_TABLE = 'blog_calendars'

export const blogCalendarsSchema: DatabaseSchemaModule = {
  key: 'blog-calendars',
  description: 'Blog content calendars migrated from Firestore.',
  statements: [
    `create table if not exists ${BLOG_CALENDARS_TABLE} (
      id text primary key,

      calendar_key text not null,

      csv text not null default '',

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `create unique index if not exists idx_blog_calendars_calendar_key
      on ${BLOG_CALENDARS_TABLE} (calendar_key);`,

    `drop trigger if exists trg_blog_calendars_manage_timestamps
      on ${BLOG_CALENDARS_TABLE};`,

    `create trigger trg_blog_calendars_manage_timestamps
      before insert or update on ${BLOG_CALENDARS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}