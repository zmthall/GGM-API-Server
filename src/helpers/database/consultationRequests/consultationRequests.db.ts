import { postgresPool } from '../../../config/postgres'
import { CondensedConsultationData, ConsultationFormDocument, ConsultationFormStatus, ConsultationMessageRecord, CreateConsultationRequestInput, UpdateConsultationRequestInput } from '../../../types/consultationForm'
import { toSafeDate, toSafeNullableDate, toSafeObject, toSafeObjectArray, toSafeString, toSafeStringArray } from '../../safe'

const TABLE_NAME = 'consultation_requests'

export interface CreateConsultationMessageInput extends CondensedConsultationData {
  id: string
  createdAt?: Date
  emailSentAt?: Date | null
  emailStatus: string
  messageId: string
  status: ConsultationFormStatus
  tags?: string[]
  rawPayload?: Record<string, unknown>
}

export interface UpdateConsultationMessageInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  contact_method?: 'email' | 'phone'
  person_seeking_care?: CondensedConsultationData['person_seeking_care']
  age_range?: CondensedConsultationData['age_range']
  insurance_type?: CondensedConsultationData['insurance_type']
  questions?: CondensedConsultationData['questions']
  placement?: CondensedConsultationData['placement']
  message?: string
  emailSentAt?: Date | null
  emailStatus?: string
  messageId?: string
  status?: ConsultationFormStatus
  tags?: string[]
  rawPayload?: Record<string, unknown>
}

const mapRow = (row: Record<string, unknown>): ConsultationMessageRecord => {
  return {
    id: toSafeString(row.id),
    contact_type: toSafeString(row.contact_type),
    created_at: toSafeDate(row.created_at),
    updated_at: toSafeDate(row.updated_at),

    first_name: toSafeString(row.first_name),
    last_name: toSafeString(row.last_name),
    email: toSafeString(row.email),
    phone: toSafeString(row.phone),
    contact_method: toSafeString(row.contact_method) as 'email' | 'phone',

    person_seeking_care: toSafeObject(row.person_seeking_care) as CondensedConsultationData['person_seeking_care'],
    age_range: toSafeString(row.age_range) as CondensedConsultationData['age_range'],
    insurance_type: toSafeObject(row.insurance_type) as CondensedConsultationData['insurance_type'],
    questions: toSafeObjectArray(row.questions) as CondensedConsultationData['questions'],
    placement: toSafeString(row.placement) as CondensedConsultationData['placement'],

    message: toSafeString(row.message),

    email_sent_at: toSafeNullableDate(row.email_sent_at),
    email_status: toSafeString(row.email_status),
    message_id: toSafeString(row.message_id),
    status: toSafeString(row.status) as ConsultationFormStatus,
    tags: toSafeStringArray(row.tags),
    raw_payload: toSafeObject(row.raw_payload),
  }
}

export const createConsultationRequest = async (
  input: CreateConsultationRequestInput
): Promise<ConsultationMessageRecord> => {
  console.log(input.age_range)

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
      person_seeking_care,
      age_range,
      insurance_type,
      questions,
      placement,
      status,
      tags,
      raw_payload,
      email_error,
      email_failed_at
    )
    values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
      $13::jsonb,$14,$15::jsonb,$16::jsonb,$17,$18,$19,$20::jsonb,$21,$22
    )
    returning *`,
    [
      input.id,
      input.contact_method,
      input.contact_type ?? 'consultation',
      input.createdAt ?? new Date(),
      input.email,
      input.emailSentAt ?? null,
      input.emailStatus ?? '',
      input.first_name,
      input.last_name,
      input.message,
      input.messageId ?? '',
      input.phone,
      JSON.stringify(input.person_seeking_care ?? {}),
      input.age_range,
      JSON.stringify(input.insurance_type ?? {}),
      JSON.stringify(input.questions ?? []),
      input.placement,
      input.status ?? 'new',
      input.tags ?? [],
      JSON.stringify(input.rawPayload ?? {}),
      input.emailError ?? '',
      input.emailFailedAt ?? null
    ]
  )

  return mapRow(result.rows[0])
}

export const updateConsultationRequest = async (
  id: string,
  input: UpdateConsultationRequestInput
): Promise<ConsultationMessageRecord | null> => {
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
      person_seeking_care = coalesce($12::jsonb, person_seeking_care),
      age_range = coalesce($13, age_range),
      insurance_type = coalesce($14::jsonb, insurance_type),
      questions = coalesce($15::jsonb, questions),
      placement = coalesce($16, placement),
      status = coalesce($17, status),
      tags = coalesce($18, tags),
      raw_payload = coalesce($19::jsonb, raw_payload),
      email_error = coalesce($20, email_error),
      email_failed_at = coalesce($21, email_failed_at),
      updated_at = now()
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
      input.personSeekingCare ? JSON.stringify(input.personSeekingCare) : null,
      input.ageRange ?? null,
      input.insuranceType ? JSON.stringify(input.insuranceType) : null,
      input.questions ? JSON.stringify(input.questions) : null,
      input.placement ?? null,
      input.status ?? null,
      input.tags ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null,
      input.emailError ?? null,
      input.emailFailedAt ?? null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const getConsultationRequestById = async (
  id: string
): Promise<ConsultationMessageRecord | null> => {
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

export const listConsultationRequests = async (): Promise<ConsultationMessageRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    order by
      case when lower(status) = 'new' then 0 else 1 end,
      created_at desc`
  )

  return result.rows.map(mapRow)
}

export const deleteConsultationRequest = async (
  id: string
): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}