import { postgresPool } from '../../../config/postgres'
import { toSafeBoolean, toSafeDate, toSafeNullableDate, toSafeObject, toSafeString, toSafeStringArray } from '../../safe'

const TABLE_NAME = 'ride_requests'

export interface RideRequestRecord {
  id: string
  acknowledge: boolean
  apt_date: string | null
  apt_time: Date | null
  contact_type: string
  created_at: Date
  dob: string
  dropoff_address: string
  email: string
  email_sent_at: Date | null
  email_status: string
  med_id: string
  message_id: string
  name: string
  notes: string
  phone: string
  pickup_address: string
  status: string
  tags: string[]
  updated_at: Date
  raw_payload: Record<string, unknown>
}

export interface CreateRideRequestInput {
  id: string
  acknowledge?: boolean
  aptDate?: string | null
  aptTime?: Date | null
  contactType: string
  createdAt?: Date
  dob: string
  dropoffAddress: string
  email: string
  emailSentAt?: Date | null
  emailStatus: string
  medId: string
  messageId: string
  name: string
  notes: string
  phone: string
  pickupAddress: string
  status: string
  tags?: string[]
  rawPayload?: Record<string, unknown>
}

export interface UpdateRideRequestInput {
  acknowledge?: boolean
  aptDate?: string | null
  aptTime?: Date | null
  contactType?: string
  dob?: string
  dropoffAddress?: string
  email?: string
  emailSentAt?: Date | null
  emailStatus?: string
  medId?: string
  messageId?: string
  name?: string
  notes?: string
  phone?: string
  pickupAddress?: string
  status?: string
  tags?: string[]
  rawPayload?: Record<string, unknown>
}

const mapRow = (row: Record<string, unknown>): RideRequestRecord => {
  return {
    id: toSafeString(row.id),
    acknowledge: toSafeBoolean(row.acknowledge),
    apt_date: row.apt_date ? toSafeString(row.apt_date) : null,
    apt_time: toSafeNullableDate(row.apt_time),
    contact_type: toSafeString(row.contact_type),
    created_at: toSafeDate(row.created_at),
    dob: toSafeString(row.dob),
    dropoff_address: toSafeString(row.dropoff_address),
    email: toSafeString(row.email),
    email_sent_at: toSafeNullableDate(row.email_sent_at),
    email_status: toSafeString(row.email_status),
    med_id: toSafeString(row.med_id),
    message_id: toSafeString(row.message_id),
    name: toSafeString(row.name),
    notes: toSafeString(row.notes),
    phone: toSafeString(row.phone),
    pickup_address: toSafeString(row.pickup_address),
    status: toSafeString(row.status),
    tags: toSafeStringArray(row.tags),
    updated_at: toSafeDate(row.updated_at),
    raw_payload: toSafeObject(row.raw_payload)
  }
}

export const upsertRideRequest = async (
  input: CreateRideRequestInput
): Promise<RideRequestRecord> => {
  const result = await postgresPool.query(
    `
    insert into ${TABLE_NAME} (
      id,
      acknowledge,
      apt_date,
      apt_time,
      contact_type,
      created_at,
      dob,
      dropoff_address,
      email,
      email_sent_at,
      email_status,
      med_id,
      message_id,
      name,
      notes,
      phone,
      pickup_address,
      status,
      tags,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb)
    on conflict (id)
    do update set
      acknowledge = excluded.acknowledge,
      apt_date = excluded.apt_date,
      apt_time = excluded.apt_time,
      contact_type = excluded.contact_type,
      dob = excluded.dob,
      dropoff_address = excluded.dropoff_address,
      email = excluded.email,
      email_sent_at = excluded.email_sent_at,
      email_status = excluded.email_status,
      med_id = excluded.med_id,
      message_id = excluded.message_id,
      name = excluded.name,
      notes = excluded.notes,
      phone = excluded.phone,
      pickup_address = excluded.pickup_address,
      status = excluded.status,
      tags = excluded.tags,
      updated_at = now(),
      raw_payload = excluded.raw_payload
    returning *
    `,
    [
      input.id,
      input.acknowledge ?? false,
      input.aptDate ?? null,
      input.aptTime ?? null,
      input.contactType,
      input.createdAt ?? new Date(),
      input.dob,
      input.dropoffAddress,
      input.email,
      input.emailSentAt ?? null,
      input.emailStatus,
      input.medId,
      input.messageId,
      input.name,
      input.notes,
      input.phone,
      input.pickupAddress,
      input.status,
      input.tags ?? [],
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const getRideRequestById = async (id: string): Promise<RideRequestRecord | null> => {
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

export const listRideRequests = async (): Promise<RideRequestRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    order by
      case when lower(status) = 'new' then 0 else 1 end,
      created_at desc`
  )

  return result.rows.map(mapRow)
}

export const listRideRequestsByStatus = async (status: string): Promise<RideRequestRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where status = $1
    order by created_at desc`,
    [status]
  )

  return result.rows.map(mapRow)
}

export const createRideRequest = async (
  input: CreateRideRequestInput
): Promise<RideRequestRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      acknowledge,
      apt_date,
      apt_time,
      contact_type,
      created_at,
      dob,
      dropoff_address,
      email,
      email_sent_at,
      email_status,
      med_id,
      message_id,
      name,
      notes,
      phone,
      pickup_address,
      status,
      tags,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb)
    returning *`,
    [
      input.id,
      input.acknowledge ?? false,
      input.aptDate ?? null,
      input.aptTime ?? null,
      input.contactType,
      input.createdAt ?? new Date(),
      input.dob,
      input.dropoffAddress,
      input.email,
      input.emailSentAt ?? null,
      input.emailStatus,
      input.medId,
      input.messageId,
      input.name,
      input.notes,
      input.phone,
      input.pickupAddress,
      input.status,
      input.tags ?? [],
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

export const updateRideRequest = async (
  id: string,
  input: UpdateRideRequestInput
): Promise<RideRequestRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
    set
      acknowledge = coalesce($2, acknowledge),
      apt_date = coalesce($3, apt_date),
      apt_time = coalesce($4, apt_time),
      contact_type = coalesce($5, contact_type),
      dob = coalesce($6, dob),
      dropoff_address = coalesce($7, dropoff_address),
      email = coalesce($8, email),
      email_sent_at = coalesce($9, email_sent_at),
      email_status = coalesce($10, email_status),
      med_id = coalesce($11, med_id),
      message_id = coalesce($12, message_id),
      name = coalesce($13, name),
      notes = coalesce($14, notes),
      phone = coalesce($15, phone),
      pickup_address = coalesce($16, pickup_address),
      status = coalesce($17, status),
      tags = coalesce($18, tags),
      raw_payload = coalesce($19::jsonb, raw_payload),
      updated_at = now()
    where id = $1
    returning *`,
    [
      id,
      input.acknowledge ?? null,
      input.aptDate ?? null,
      input.aptTime ?? null,
      input.contactType ?? null,
      input.dob ?? null,
      input.dropoffAddress ?? null,
      input.email ?? null,
      input.emailSentAt ?? null,
      input.emailStatus ?? null,
      input.medId ?? null,
      input.messageId ?? null,
      input.name ?? null,
      input.notes ?? null,
      input.phone ?? null,
      input.pickupAddress ?? null,
      input.status ?? null,
      input.tags ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteRideRequest = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}