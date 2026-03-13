import type { DatabaseSchemaModule } from '../schema.types'

export const JOB_DESCRIPTIONS_TABLE = 'job_descriptions'

export const jobDescriptionsSchema: DatabaseSchemaModule = {
  key: 'job-descriptions',
  description: 'Job description content records used by the careers system.',
  statements: [
    `create table if not exists ${JOB_DESCRIPTIONS_TABLE} (
      id text primary key,

      title text not null,
      description text not null default '',
      responsibilities text not null default '',
      qualifications text not null default '',
      select_label text not null default '',
      shifts text not null default '',

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      raw_payload jsonb not null default '{}'::jsonb
    );`,

    `drop trigger if exists trg_job_descriptions_manage_timestamps
      on ${JOB_DESCRIPTIONS_TABLE};`,

    `create trigger trg_job_descriptions_manage_timestamps
      before insert or update on ${JOB_DESCRIPTIONS_TABLE}
      for each row
      execute function manage_row_timestamps();`
  ]
}