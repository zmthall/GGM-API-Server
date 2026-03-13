import { postgresPool } from "../../../config/postgres"

const TABLE_NAME = 'admin_correspondence_counts'
const SINGLETON_ID = 'correspondence_counts'

export interface CorrespondenceCountsRecord {
  id: string
  applications_new: number
  messages_new: number
  ride_requests_new: number
  created_at: Date
  updated_at: Date
  raw_payload: Record<string, unknown>
}

export interface UpdateCorrespondenceCountsInput {
  applicationsNew?: number
  messagesNew?: number
  rideRequestsNew?: number
  rawPayload?: Record<string, unknown>
}
export interface UpsertCorrespondenceCountsInput {
  applicationsNew: number
  messagesNew: number
  rideRequestsNew: number
  createdAt?: Date | null
  updatedAt?: Date | null
  rawPayload?: Record<string, unknown>
}

export const upsertCorrespondenceCounts = async (
  input: UpsertCorrespondenceCountsInput
): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb)
      on conflict (id)
      do update set
        applications_new = excluded.applications_new,
        messages_new = excluded.messages_new,
        ride_requests_new = excluded.ride_requests_new,
        raw_payload = excluded.raw_payload
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [
      SINGLETON_ID,
      input.applicationsNew,
      input.messagesNew,
      input.rideRequestsNew,
      input.createdAt ?? new Date(),
      input.updatedAt ?? new Date(),
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  if (!result.rows.length) {
    throw new Error('Failed to upsert correspondence counts.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

const mapRowToCorrespondenceCountsRecord = (row: Record<string, unknown>): CorrespondenceCountsRecord => {
  return {
    id: String(row.id),
    applications_new: Number(row.applications_new ?? 0),
    messages_new: Number(row.messages_new ?? 0),
    ride_requests_new: Number(row.ride_requests_new ?? 0),
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
    raw_payload: (row.raw_payload as Record<string, unknown> | null) ?? {}
  }
}

export const getCorrespondenceCounts = async (): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `select
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload
      from ${TABLE_NAME}
      where id = $1
      limit 1;`,
    [SINGLETON_ID]
  )

  if (!result.rows.length) {
    throw new Error('Correspondence counts row was not found.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const updateCorrespondenceCounts = async (
  input: UpdateCorrespondenceCountsInput
): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set
        applications_new = coalesce($2, applications_new),
        messages_new = coalesce($3, messages_new),
        ride_requests_new = coalesce($4, ride_requests_new),
        raw_payload = coalesce($5::jsonb, raw_payload)
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [
      SINGLETON_ID,
      input.applicationsNew ?? null,
      input.messagesNew ?? null,
      input.rideRequestsNew ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) {
    throw new Error('Failed to update correspondence counts.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const incrementApplicationsNew = async (amount = 1): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set applications_new = applications_new + $2
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [SINGLETON_ID, amount]
  )

  if (!result.rows.length) {
    throw new Error('Failed to increment applications_new.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const incrementMessagesNew = async (amount = 1): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set messages_new = messages_new + $2
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [SINGLETON_ID, amount]
  )

  if (!result.rows.length) {
    throw new Error('Failed to increment messages_new.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const incrementRideRequestsNew = async (amount = 1): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set ride_requests_new = ride_requests_new + $2
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [SINGLETON_ID, amount]
  )

  if (!result.rows.length) {
    throw new Error('Failed to increment ride_requests_new.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const decrementApplicationsNew = async (amount = 1): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set applications_new = greatest(applications_new - $2, 0)
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [SINGLETON_ID, amount]
  )

  if (!result.rows.length) {
    throw new Error('Failed to decrement applications_new.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const decrementMessagesNew = async (amount = 1): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set messages_new = greatest(messages_new - $2, 0)
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [SINGLETON_ID, amount]
  )

  if (!result.rows.length) {
    throw new Error('Failed to decrement messages_new.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const decrementRideRequestsNew = async (amount = 1): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set ride_requests_new = greatest(ride_requests_new - $2, 0)
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [SINGLETON_ID, amount]
  )

  if (!result.rows.length) {
    throw new Error('Failed to decrement ride_requests_new.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}

export const resetCorrespondenceCounts = async (): Promise<CorrespondenceCountsRecord> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
      set
        applications_new = 0,
        messages_new = 0,
        ride_requests_new = 0
      where id = $1
      returning
        id,
        applications_new,
        messages_new,
        ride_requests_new,
        created_at,
        updated_at,
        raw_payload;`,
    [SINGLETON_ID]
  )

  if (!result.rows.length) {
    throw new Error('Failed to reset correspondence counts.')
  }

  return mapRowToCorrespondenceCountsRecord(result.rows[0])
}