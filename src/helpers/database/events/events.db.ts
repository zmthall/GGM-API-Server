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

const mapRow = (row: Record<string, unknown>): EventRecord => {
  return {
    id: String(row.id),
    address: String(row.address ?? ''),
    archived: Boolean(row.archived),
    date_start: (row.date_start as Date | null) ?? null,
    date_end: (row.date_end as Date | null) ?? null,
    description: String(row.description ?? ''),
    link: String(row.link ?? ''),
    location: String(row.location ?? ''),
    title: String(row.title ?? ''),
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
    raw_payload: (row.raw_payload as Record<string, unknown>) ?? {}
  }
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
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
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
      input.rawPayload ? JSON.stringify(input.rawPayload) : '{}'
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
      raw_payload = coalesce($10::jsonb, raw_payload)
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