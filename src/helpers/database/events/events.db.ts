import { postgresPool } from '../../../config/postgres'

const TABLE_NAME = 'events'

export interface EventRecord {
  id: string
  address: string
  archived: boolean
  date_start: Date | null
  date_end: Date | null
  description: string
  link: string
  location: string
  title: string
  created_at: Date
  updated_at: Date
  raw_payload: Record<string, unknown>
}

export interface CreateEventInput {
  id: string
  address: string
  archived?: boolean
  dateStart?: Date | null
  dateEnd?: Date | null
  description: string
  link: string
  location: string
  title: string
  rawPayload?: Record<string, unknown>
}

export interface UpdateEventInput {
  address?: string
  archived?: boolean
  dateStart?: Date | null
  dateEnd?: Date | null
  description?: string
  link?: string
  location?: string
  title?: string
  rawPayload?: Record<string, unknown>
}

const toSafeString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const toSafeBoolean = (value: unknown): boolean => {
  return typeof value === 'boolean' ? value : false
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

const toSafeNullableDate = (value: unknown): Date | null => {
  if (value == null) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

const toSafeObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

const mapRow = (row: Record<string, unknown>): EventRecord => {
  return {
    id: toSafeString(row.id),
    address: toSafeString(row.address),
    archived: toSafeBoolean(row.archived),
    date_start: toSafeNullableDate(row.date_start),
    date_end: toSafeNullableDate(row.date_end),
    description: toSafeString(row.description),
    link: toSafeString(row.link),
    location: toSafeString(row.location),
    title: toSafeString(row.title),
    created_at: toSafeDate(row.created_at),
    updated_at: toSafeDate(row.updated_at),
    raw_payload: toSafeObject(row.raw_payload)
  }
}

export const upsertEvent = async (input: CreateEventInput): Promise<EventRecord> => {
  const result = await postgresPool.query(
    `
    insert into ${TABLE_NAME} (
      id,
      address,
      archived,
      date_start,
      date_end,
      description,
      link,
      location,
      title,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
    on conflict (id)
    do update set
      address = excluded.address,
      archived = excluded.archived,
      date_start = excluded.date_start,
      date_end = excluded.date_end,
      description = excluded.description,
      link = excluded.link,
      location = excluded.location,
      title = excluded.title,
      updated_at = now(),
      raw_payload = excluded.raw_payload
    returning *
    `,
    [
      input.id,
      input.address,
      input.archived ?? false,
      input.dateStart ?? null,
      input.dateEnd ?? null,
      input.description,
      input.link,
      input.location,
      input.title,
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const getEventById = async (id: string): Promise<EventRecord | null> => {
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

export const listEvents = async (): Promise<EventRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    order by date_start desc nulls last, title asc`
  )

  return result.rows.map(mapRow)
}

export const listActiveEvents = async (): Promise<EventRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where archived = false
    order by date_start desc nulls last, title asc`
  )

  return result.rows.map(mapRow)
}

export const listArchivedEvents = async (): Promise<EventRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where archived = true
    order by date_start desc nulls last, title asc`
  )

  return result.rows.map(mapRow)
}

export const createEvent = async (input: CreateEventInput): Promise<EventRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      address,
      archived,
      date_start,
      date_end,
      description,
      link,
      location,
      title,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
    returning *`,
    [
      input.id,
      input.address,
      input.archived ?? false,
      input.dateStart ?? null,
      input.dateEnd ?? null,
      input.description,
      input.link,
      input.location,
      input.title,
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const updateEvent = async (
  id: string,
  input: UpdateEventInput
): Promise<EventRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
    set
      address = coalesce($2, address),
      archived = coalesce($3, archived),
      date_start = coalesce($4, date_start),
      date_end = coalesce($5, date_end),
      description = coalesce($6, description),
      link = coalesce($7, link),
      location = coalesce($8, location),
      title = coalesce($9, title),
      raw_payload = coalesce($10::jsonb, raw_payload),
      updated_at = now()
    where id = $1
    returning *`,
    [
      id,
      input.address ?? null,
      input.archived ?? null,
      input.dateStart ?? null,
      input.dateEnd ?? null,
      input.description ?? null,
      input.link ?? null,
      input.location ?? null,
      input.title ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteEvent = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}