import type { DatabaseSchemaModule } from '../schema.types'

export const CONSULTATION_REQUESTS_TABLE = 'consultation_requests'

export const consultationRequestsSchema: DatabaseSchemaModule = {
  key: 'consultation_requests',
  description: 'Assisted living consultation form submissions and communication records.',
  statements: [
    `create table if not exists ${CONSULTATION_REQUESTS_TABLE} (
      id text primary key,

      contact_type text not null default 'consultation',

      created_at timestamptz not null default now(),

      first_name text not null default '',
      last_name text not null default '',
      email text not null default '',
      phone text not null default '',
      contact_method text not null default '',

      person_seeking_care jsonb not null default '{}'::jsonb,
      age_range text not null default '',
      insurance_type jsonb not null default '{}'::jsonb,
      questions jsonb not null default '[]'::jsonb,
      placement text not null default '',

      message text not null default '',

      status text not null default 'new',
      tags text[] not null default '{}',

      email_sent_at timestamptz,
      email_status text not null default '',
      message_id text not null default '',
      email_error text not null default '',
      email_failed_at timestamptz,

      updated_at timestamptz not null default now(),

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `create index if not exists idx_consultation_requests_status
      on ${CONSULTATION_REQUESTS_TABLE} (status);`,

    `create index if not exists idx_consultation_requests_created_at
      on ${CONSULTATION_REQUESTS_TABLE} (created_at desc);`,

    `create index if not exists idx_consultation_requests_email_status
      on ${CONSULTATION_REQUESTS_TABLE} (email_status);`,

    `create index if not exists idx_consultation_requests_contact_method
      on ${CONSULTATION_REQUESTS_TABLE} (contact_method);`,

    `create index if not exists idx_consultation_requests_age_range
      on ${CONSULTATION_REQUESTS_TABLE} (age_range);`,

    `create index if not exists idx_consultation_requests_placement
      on ${CONSULTATION_REQUESTS_TABLE} (placement);`,

    `create index if not exists idx_consultation_requests_person_seeking_care
      on ${CONSULTATION_REQUESTS_TABLE} using gin (person_seeking_care);`,

    `create index if not exists idx_consultation_requests_insurance_type
      on ${CONSULTATION_REQUESTS_TABLE} using gin (insurance_type);`,

    `create index if not exists idx_consultation_requests_questions
      on ${CONSULTATION_REQUESTS_TABLE} using gin (questions);`,

    `drop trigger if exists trg_consultation_requests_manage_timestamps
      on ${CONSULTATION_REQUESTS_TABLE};`,

    `create trigger trg_consultation_requests_manage_timestamps
      before insert or update on ${CONSULTATION_REQUESTS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}