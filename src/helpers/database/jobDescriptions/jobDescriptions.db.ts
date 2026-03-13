import { postgresPool } from '../../../config/postgres'

const TABLE_NAME = 'job_descriptions'

export interface JobDescriptionRecord {
  id: string
  title: string
  description: string
  responsibilities: string
  qualifications: string
  select_label: string
  shifts: string
  created_at: Date
  updated_at: Date
  raw_payload: Record<string, unknown>
}

export interface CreateJobDescriptionInput {
  id: string
  title: string
  description: string
  responsibilities: string
  qualifications: string
  selectLabel: string
  shifts: string
  rawPayload?: Record<string, unknown>
}

export interface UpdateJobDescriptionInput {
  title?: string
  description?: string
  responsibilities?: string
  qualifications?: string
  selectLabel?: string
  shifts?: string
  rawPayload?: Record<string, unknown>
}

const mapRow = (row: Record<string, unknown>): JobDescriptionRecord => {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ''),
    responsibilities: String(row.responsibilities ?? ''),
    qualifications: String(row.qualifications ?? ''),
    select_label: String(row.select_label ?? ''),
    shifts: String(row.shifts ?? ''),
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
    raw_payload: (row.raw_payload as Record<string, unknown>) ?? {}
  }
}

export const getJobDescriptionById = async (
  id: string
): Promise<JobDescriptionRecord | null> => {
  const result = await postgresPool.query(
    `
    select *
    from ${TABLE_NAME}
    where id = $1
    limit 1
    `,
    [id]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const listJobDescriptions = async (): Promise<JobDescriptionRecord[]> => {
  const result = await postgresPool.query(
    `
    select *
    from ${TABLE_NAME}
    order by title asc
    `
  )

  return result.rows.map(mapRow)
}

export const createJobDescription = async (
  input: CreateJobDescriptionInput
): Promise<JobDescriptionRecord> => {
  const result = await postgresPool.query(
    `
    insert into ${TABLE_NAME} (
      id,
      title,
      description,
      responsibilities,
      qualifications,
      select_label,
      shifts,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8)
    returning *
    `,
    [
      input.id,
      input.title,
      input.description,
      input.responsibilities,
      input.qualifications,
      input.selectLabel,
      input.shifts,
      input.rawPayload ? JSON.stringify(input.rawPayload) : '{}'
    ]
  )

  return mapRow(result.rows[0])
}

export const updateJobDescription = async (
  id: string,
  input: UpdateJobDescriptionInput
): Promise<JobDescriptionRecord | null> => {
  const result = await postgresPool.query(
    `
    update ${TABLE_NAME}
    set
      title = coalesce($2, title),
      description = coalesce($3, description),
      responsibilities = coalesce($4, responsibilities),
      qualifications = coalesce($5, qualifications),
      select_label = coalesce($6, select_label),
      shifts = coalesce($7, shifts),
      raw_payload = coalesce($8::jsonb, raw_payload)
    where id = $1
    returning *
    `,
    [
      id,
      input.title ?? null,
      input.description ?? null,
      input.responsibilities ?? null,
      input.qualifications ?? null,
      input.selectLabel ?? null,
      input.shifts ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteJobDescription = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `
    delete from ${TABLE_NAME}
    where id = $1
    `,
    [id]
  )

  return result.rowCount === 1
}