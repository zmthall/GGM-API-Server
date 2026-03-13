import { postgresPool } from '../../../config/postgres'

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
    id: String(row.id),
    acknowledge: Boolean(row.acknowledge),
    apt_date: row.apt_date ? String(row.apt_date) : null,
    apt_time: (row.apt_time as Date | null) ?? null,
    contact_type: String(row.contact_type ?? ''),
    created_at: row.created_at as Date,
    dob: String(row.dob ?? ''),
    dropoff_address: String(row.dropoff_address ?? ''),
    email: String(row.email ?? ''),
    email_sent_at: (row.email_sent_at as Date | null) ?? null,
    email_status: String(row.email_status ?? ''),
    med_id: String(row.med_id ?? ''),
    message_id: String(row.message_id ?? ''),
    name: String(row.name ?? ''),
    notes: String(row.notes ?? ''),
    phone: String(row.phone ?? ''),
    pickup_address: String(row.pickup_address ?? ''),
    status: String(row.status ?? ''),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    updated_at: row.updated_at as Date,
    raw_payload: (row.raw_payload as Record<string, unknown>) ?? {}
  }
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
    order by created_at desc`
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
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
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
      input.rawPayload ? JSON.stringify(input.rawPayload) : '{}'
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
      raw_payload = coalesce($19::jsonb, raw_payload)
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