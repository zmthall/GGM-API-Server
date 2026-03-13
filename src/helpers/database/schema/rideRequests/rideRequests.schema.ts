import type { DatabaseSchemaModule } from '../schema.types'

export const RIDE_REQUESTS_TABLE = 'ride_requests'

export const rideRequestsSchema: DatabaseSchemaModule = {
  key: 'ride_requests',
  description: 'Ride request submissions and operational transport request records.',
  statements: [
    `create table if not exists ${RIDE_REQUESTS_TABLE} (
      id text primary key,

      acknowledge boolean not null default false,

      apt_date date,
      apt_time timestamptz,

      contact_type text not null default '',
      created_at timestamptz not null default now(),

      dob text not null default '',
      dropoff_address text not null default '',
      email text not null default '',

      email_sent_at timestamptz,
      email_status text not null default '',

      med_id text not null default '',
      message_id text not null default '',
      name text not null default '',
      notes text not null default '',
      phone text not null default '',
      pickup_address text not null default '',

      status text not null default '',
      tags text[] not null default '{}',

      updated_at timestamptz not null default now(),

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `create index if not exists idx_ride_requests_status
      on ${RIDE_REQUESTS_TABLE} (status);`,

    `create index if not exists idx_ride_requests_created_at
      on ${RIDE_REQUESTS_TABLE} (created_at desc);`,

    `create index if not exists idx_ride_requests_apt_date
      on ${RIDE_REQUESTS_TABLE} (apt_date desc);`,

    `create index if not exists idx_ride_requests_email_status
      on ${RIDE_REQUESTS_TABLE} (email_status);`,

    `drop trigger if exists trg_ride_requests_manage_timestamps
      on ${RIDE_REQUESTS_TABLE};`,

    `create trigger trg_ride_requests_manage_timestamps
      before insert or update on ${RIDE_REQUESTS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}