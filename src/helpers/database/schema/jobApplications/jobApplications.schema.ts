import type { DatabaseSchemaModule } from '../schema.types'

export const JOB_APPLICATIONS_TABLE = 'job_applications'

export const jobApplicationsSchema: DatabaseSchemaModule = {
  key: 'job_applications',
  description: 'Job application submissions migrated from Firestore.',
  statements: [
    `create table if not exists ${JOB_APPLICATIONS_TABLE} (
      id text primary key,

      contact_type text not null default '',
      created_at timestamptz not null default now(),

      department text not null default '',
      position text not null default '',
      position_name text not null default '',

      status text not null default '',
      tags text[] not null default '{}',

      updated_at timestamptz not null default now(),

      personal_payload jsonb not null default '{}'::jsonb,
      driving_payload jsonb not null default '{}'::jsonb,
      work_payload jsonb not null default '{}'::jsonb,

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `create index if not exists idx_job_applications_status
      on ${JOB_APPLICATIONS_TABLE} (status);`,

    `create index if not exists idx_job_applications_department
      on ${JOB_APPLICATIONS_TABLE} (department);`,

    `create index if not exists idx_job_applications_position
      on ${JOB_APPLICATIONS_TABLE} (position);`,

    `create index if not exists idx_job_applications_position_name
      on ${JOB_APPLICATIONS_TABLE} (position_name);`,

    `create index if not exists idx_job_applications_created_at
      on ${JOB_APPLICATIONS_TABLE} (created_at desc);`,

    `drop trigger if exists trg_job_applications_manage_timestamps
      on ${JOB_APPLICATIONS_TABLE};`,

    `create trigger trg_job_applications_manage_timestamps
      before insert or update on ${JOB_APPLICATIONS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}