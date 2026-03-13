import { postgresPool } from '../../../config/postgres'

const TABLE_NAME = 'contact_messages'

export interface ContactMessageRecord {
  id: string
  contact_method: string
  contact_type: string
  created_at: Date
  email: string
  email_sent_at: Date | null
  email_status: string
  first_name: string
  last_name: string
  message: string
  message_id: string
  phone: string
  reason: string
  status: string
  tags: string[]
  updated_at: Date
  raw_payload: Record<string, unknown>
}

export interface CreateContactMessageInput {
  id: string
  contactMethod: string
  contactType: string
  createdAt?: Date
  email: string
  emailSentAt?: Date | null
  emailStatus: string
  firstName: string
  lastName: string
  message: string
  messageId: string
  phone: string
  reason: string
  status: string
  tags?: string[]
  rawPayload?: Record<string, unknown>
}

export interface UpdateContactMessageInput {
  contactMethod?: string
  contactType?: string
  email?: string
  emailSentAt?: Date | null
  emailStatus?: string
  firstName?: string
  lastName?: string
  message?: string
  messageId?: string
  phone?: string
  reason?: string
  status?: string
  tags?: string[]
  rawPayload?: Record<string, unknown>
}

export const upsertContactMessage = async (
  input: CreateContactMessageInput
): Promise<ContactMessageRecord> => {
  const result = await postgresPool.query(
    `
    insert into ${TABLE_NAME} (
      id,
      contact_method,
      contact_type,
      created_at,
      email,
      email_sent_at,
      email_status,
      first_name,
      last_name,
      message,
      message_id,
      phone,
      reason,
      status,
      tags,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)
    on conflict (id)
    do update set
      contact_method = excluded.contact_method,
      contact_type = excluded.contact_type,
      email = excluded.email,
      email_sent_at = excluded.email_sent_at,
      email_status = excluded.email_status,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      message = excluded.message,
      message_id = excluded.message_id,
      phone = excluded.phone,
      reason = excluded.reason,
      status = excluded.status,
      tags = excluded.tags,
      raw_payload = excluded.raw_payload
    returning *
    `,
    [
      input.id,
      input.contactMethod,
      input.contactType,
      input.createdAt ?? new Date(),
      input.email,
      input.emailSentAt ?? null,
      input.emailStatus,
      input.firstName,
      input.lastName,
      input.message,
      input.messageId,
      input.phone,
      input.reason,
      input.status,
      input.tags ?? [],
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

const mapRow = (row: Record<string, unknown>): ContactMessageRecord => {
  return {
    id: String(row.id),
    contact_method: String(row.contact_method ?? ''),
    contact_type: String(row.contact_type ?? ''),
    created_at: row.created_at as Date,
    email: String(row.email ?? ''),
    email_sent_at: (row.email_sent_at as Date | null) ?? null,
    email_status: String(row.email_status ?? ''),
    first_name: String(row.first_name ?? ''),
    last_name: String(row.last_name ?? ''),
    message: String(row.message ?? ''),
    message_id: String(row.message_id ?? ''),
    phone: String(row.phone ?? ''),
    reason: String(row.reason ?? ''),
    status: String(row.status ?? ''),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    updated_at: row.updated_at as Date,
    raw_payload: (row.raw_payload as Record<string, unknown>) ?? {}
  }
}

export const getContactMessageById = async (
  id: string
): Promise<ContactMessageRecord | null> => {
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

export const listContactMessages = async (): Promise<ContactMessageRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    order by created_at desc`
  )

  return result.rows.map(mapRow)
}

export const createContactMessage = async (
  input: CreateContactMessageInput
): Promise<ContactMessageRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      contact_method,
      contact_type,
      created_at,
      email,
      email_sent_at,
      email_status,
      first_name,
      last_name,
      message,
      message_id,
      phone,
      reason,
      status,
      tags,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    returning *`,
    [
      input.id,
      input.contactMethod,
      input.contactType,
      input.createdAt ?? new Date(),
      input.email,
      input.emailSentAt ?? null,
      input.emailStatus,
      input.firstName,
      input.lastName,
      input.message,
      input.messageId,
      input.phone,
      input.reason,
      input.status,
      input.tags ?? [],
      input.rawPayload ? JSON.stringify(input.rawPayload) : '{}'
    ]
  )

  return mapRow(result.rows[0])
}

export const updateContactMessage = async (
  id: string,
  input: UpdateContactMessageInput
): Promise<ContactMessageRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
    set
      contact_method = coalesce($2, contact_method),
      contact_type = coalesce($3, contact_type),
      email = coalesce($4, email),
      email_sent_at = coalesce($5, email_sent_at),
      email_status = coalesce($6, email_status),
      first_name = coalesce($7, first_name),
      last_name = coalesce($8, last_name),
      message = coalesce($9, message),
      message_id = coalesce($10, message_id),
      phone = coalesce($11, phone),
      reason = coalesce($12, reason),
      status = coalesce($13, status),
      tags = coalesce($14, tags),
      raw_payload = coalesce($15::jsonb, raw_payload)
    where id = $1
    returning *`,
    [
      id,
      input.contactMethod ?? null,
      input.contactType ?? null,
      input.email ?? null,
      input.emailSentAt ?? null,
      input.emailStatus ?? null,
      input.firstName ?? null,
      input.lastName ?? null,
      input.message ?? null,
      input.messageId ?? null,
      input.phone ?? null,
      input.reason ?? null,
      input.status ?? null,
      input.tags ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteContactMessage = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}