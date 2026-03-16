import { postgresPool } from '../../../config/postgres'
import { toSafeDate, toSafeObject, toSafeString, toSafeStringArray } from '../../safe'

const TABLE_NAME = 'job_applications'

export interface JobApplicationRecord {
  id: string
  contact_type: string
  created_at: Date
  department: string
  position: string
  position_name: string
  status: string
  tags: string[]
  updated_at: Date
  personal_payload: Record<string, unknown>
  driving_payload: Record<string, unknown>
  work_payload: Record<string, unknown>
  raw_payload: Record<string, unknown>
}

export interface CreateJobApplicationInput {
  id: string
  contactType: string
  createdAt?: Date
  department: string
  position: string
  positionName: string
  status: string
  tags?: string[]
  personalPayload?: Record<string, unknown>
  drivingPayload?: Record<string, unknown>
  workPayload?: Record<string, unknown>
  rawPayload?: Record<string, unknown>
}

export interface UpdateJobApplicationInput {
  contactType?: string
  department?: string
  position?: string
  positionName?: string
  status?: string
  tags?: string[]
  personalPayload?: Record<string, unknown>
  drivingPayload?: Record<string, unknown>
  workPayload?: Record<string, unknown>
  rawPayload?: Record<string, unknown>
}

const mapRow = (row: Record<string, unknown>): JobApplicationRecord => {
  return {
    id: toSafeString(row.id),
    contact_type: toSafeString(row.contact_type),
    created_at: toSafeDate(row.created_at),
    department: toSafeString(row.department),
    position: toSafeString(row.position),
    position_name: toSafeString(row.position_name),
    status: toSafeString(row.status),
    tags: toSafeStringArray(row.tags),
    updated_at: toSafeDate(row.updated_at),
    personal_payload: toSafeObject(row.personal_payload),
    driving_payload: toSafeObject(row.driving_payload),
    work_payload: toSafeObject(row.work_payload),
    raw_payload: toSafeObject(row.raw_payload)
  }
}

export const upsertJobApplication = async (
  input: CreateJobApplicationInput
): Promise<JobApplicationRecord> => {
  const result = await postgresPool.query(
    `
    insert into ${TABLE_NAME} (
      id,
      contact_type,
      created_at,
      department,
      position,
      position_name,
      status,
      tags,
      personal_payload,
      driving_payload,
      work_payload,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb)
    on conflict (id)
    do update set
      contact_type = excluded.contact_type,
      department = excluded.department,
      position = excluded.position,
      position_name = excluded.position_name,
      status = excluded.status,
      tags = excluded.tags,
      personal_payload = excluded.personal_payload,
      driving_payload = excluded.driving_payload,
      work_payload = excluded.work_payload,
      raw_payload = excluded.raw_payload,
      updated_at = now()
    returning *
    `,
    [
      input.id,
      input.contactType,
      input.createdAt ?? new Date(),
      input.department,
      input.position,
      input.positionName,
      input.status,
      input.tags ?? [],
      JSON.stringify(input.personalPayload ?? {}),
      JSON.stringify(input.drivingPayload ?? {}),
      JSON.stringify(input.workPayload ?? {}),
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const getJobApplicationById = async (id: string): Promise<JobApplicationRecord | null> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where id = $1
    limit 1`,
    [id]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const listJobApplications = async (): Promise<JobApplicationRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    order by
      case when lower(status) = 'new' then 0 else 1 end,
      created_at desc`
  )

  return result.rows.map(mapRow)
}

export const listJobApplicationsByStatus = async (status: string): Promise<JobApplicationRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where status = $1
    order by created_at desc`,
    [status]
  )

  return result.rows.map(mapRow)
}

export const listJobApplicationsByDepartment = async (department: string): Promise<JobApplicationRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where department = $1
    order by
      case when lower(status) = 'new' then 0 else 1 end,
      created_at desc`,
    [department]
  )

  return result.rows.map(mapRow)
}

export const createJobApplication = async (
  input: CreateJobApplicationInput
): Promise<JobApplicationRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      contact_type,
      created_at,
      department,
      position,
      position_name,
      status,
      tags,
      personal_payload,
      driving_payload,
      work_payload,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb)
    returning *`,
    [
      input.id,
      input.contactType,
      input.createdAt ?? new Date(),
      input.department,
      input.position,
      input.positionName,
      input.status,
      input.tags ?? [],
      JSON.stringify(input.personalPayload ?? {}),
      JSON.stringify(input.drivingPayload ?? {}),
      JSON.stringify(input.workPayload ?? {}),
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const updateJobApplication = async (
  id: string,
  input: UpdateJobApplicationInput
): Promise<JobApplicationRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
    set
      contact_type = coalesce($2, contact_type),
      department = coalesce($3, department),
      position = coalesce($4, position),
      position_name = coalesce($5, position_name),
      status = coalesce($6, status),
      tags = coalesce($7, tags),
      personal_payload = coalesce($8::jsonb, personal_payload),
      driving_payload = coalesce($9::jsonb, driving_payload),
      work_payload = coalesce($10::jsonb, work_payload),
      raw_payload = coalesce($11::jsonb, raw_payload),
      updated_at = now()
    where id = $1
    returning *`,
    [
      id,
      input.contactType ?? null,
      input.department ?? null,
      input.position ?? null,
      input.positionName ?? null,
      input.status ?? null,
      input.tags ?? null,
      input.personalPayload ? JSON.stringify(input.personalPayload) : null,
      input.drivingPayload ? JSON.stringify(input.drivingPayload) : null,
      input.workPayload ? JSON.stringify(input.workPayload) : null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteJobApplication = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}