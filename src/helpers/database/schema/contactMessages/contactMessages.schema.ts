import type { DatabaseSchemaModule } from '../schema.types'

export const CONTACT_MESSAGES_TABLE = 'contact_messages'

export const contactMessagesSchema: DatabaseSchemaModule = {
  key: 'contact_messages',
  description: 'Contact form messages and communication records.',
  statements: [
    `create table if not exists ${CONTACT_MESSAGES_TABLE} (
      id text primary key,

      contact_method text not null default '',
      contact_type text not null default '',

      created_at timestamptz not null default now(),

      email text not null default '',
      email_sent_at timestamptz,
      email_status text not null default '',

      first_name text not null default '',
      last_name text not null default '',

      message text not null default '',
      message_id text not null default '',

      phone text not null default '',
      reason text not null default '',
      status text not null default '',

      tags text[] not null default '{}',

      updated_at timestamptz not null default now(),

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `create index if not exists idx_contact_messages_status
      on ${CONTACT_MESSAGES_TABLE} (status);`,

    `create index if not exists idx_contact_messages_created_at
      on ${CONTACT_MESSAGES_TABLE} (created_at desc);`,

    `create index if not exists idx_contact_messages_email_status
      on ${CONTACT_MESSAGES_TABLE} (email_status);`,

    `create index if not exists idx_contact_messages_reason
      on ${CONTACT_MESSAGES_TABLE} (reason);`,

    `drop trigger if exists trg_contact_messages_manage_timestamps
      on ${CONTACT_MESSAGES_TABLE};`,

    `create trigger trg_contact_messages_manage_timestamps
      before insert or update on ${CONTACT_MESSAGES_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}