import { postgresPool } from '../../../config/postgres'

const TABLE_NAME = 'blog_calendars'

export interface BlogCalendarRecord {
  id: string
  calendar_key: string
  csv: string
  created_at: Date
  updated_at: Date
  raw_payload: Record<string, unknown>
}

export interface CreateBlogCalendarInput {
  id: string
  calendarKey: string
  csv: string
  createdAt?: Date
  updatedAt?: Date
  rawPayload?: Record<string, unknown>
}

export interface UpdateBlogCalendarInput {
  calendarKey?: string
  csv?: string
  rawPayload?: Record<string, unknown>
}

const toSafeString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const toSafeDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date(0)
}

const toSafeObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

const mapRow = (row: Record<string, unknown>): BlogCalendarRecord => {
  return {
    id: toSafeString(row.id),
    calendar_key: toSafeString(row.calendar_key),
    csv: toSafeString(row.csv),
    created_at: toSafeDate(row.created_at),
    updated_at: toSafeDate(row.updated_at),
    raw_payload: toSafeObject(row.raw_payload)
  }
}

export const upsertBlogCalendar = async (
  input: CreateBlogCalendarInput
): Promise<BlogCalendarRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      calendar_key,
      csv,
      created_at,
      updated_at,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6::jsonb)
    on conflict (id)
    do update set
      calendar_key = excluded.calendar_key,
      csv = excluded.csv,
      updated_at = excluded.updated_at,
      raw_payload = excluded.raw_payload
    returning *`,
    [
      input.id,
      input.calendarKey,
      input.csv,
      input.createdAt ?? new Date(),
      input.updatedAt ?? new Date(),
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const getBlogCalendarById = async (id: string): Promise<BlogCalendarRecord | null> => {
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

export const getBlogCalendarByKey = async (calendarKey: string): Promise<BlogCalendarRecord | null> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where calendar_key = $1
    limit 1`,
    [calendarKey]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const listBlogCalendars = async (): Promise<BlogCalendarRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    order by updated_at desc`
  )

  return result.rows.map(mapRow)
}

export const createBlogCalendar = async (
  input: CreateBlogCalendarInput
): Promise<BlogCalendarRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      calendar_key,
      csv,
      created_at,
      updated_at,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6::jsonb)
    returning *`,
    [
      input.id,
      input.calendarKey,
      input.csv,
      input.createdAt ?? new Date(),
      input.updatedAt ?? new Date(),
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const updateBlogCalendar = async (
  id: string,
  input: UpdateBlogCalendarInput
): Promise<BlogCalendarRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
    set
      calendar_key = coalesce($2, calendar_key),
      csv = coalesce($3, csv),
      raw_payload = coalesce($4::jsonb, raw_payload),
      updated_at = now()
    where id = $1
    returning *`,
    [
      id,
      input.calendarKey ?? null,
      input.csv ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteBlogCalendar = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}