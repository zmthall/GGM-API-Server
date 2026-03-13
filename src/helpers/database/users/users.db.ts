import { postgresPool } from '../../../config/postgres'

const TABLE_NAME = 'users'

export interface UserRecord {
  id: string
  display_name: string
  email: string
  role: string
  status: string
  created_at: Date
  created_by: string
  last_login: Date | null
  last_password_reset: Date | null
  updated_at: Date
  updated_by: string
  raw_payload: Record<string, unknown>
}

export interface CreateUserInput {
  id: string
  displayName: string
  email: string
  role: string
  status: string
  createdBy: string
  lastLogin?: Date | null
  lastPasswordReset?: Date | null
  updatedBy?: string
  rawPayload?: Record<string, unknown>
}

export interface UpdateUserInput {
  displayName?: string
  email?: string
  role?: string
  status?: string
  lastLogin?: Date | null
  lastPasswordReset?: Date | null
  updatedBy?: string
  rawPayload?: Record<string, unknown>
}

export const upsertUser = async (input: CreateUserInput): Promise<UserRecord> => {
  const result = await postgresPool.query(
    `
    insert into ${TABLE_NAME} (
      id,
      display_name,
      email,
      role,
      status,
      created_by,
      last_login,
      last_password_reset,
      updated_by,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
    on conflict (id)
    do update set
      display_name = excluded.display_name,
      email = excluded.email,
      role = excluded.role,
      status = excluded.status,
      last_login = excluded.last_login,
      last_password_reset = excluded.last_password_reset,
      updated_by = excluded.updated_by,
      raw_payload = excluded.raw_payload
    returning *
    `,
    [
      input.id,
      input.displayName,
      input.email,
      input.role,
      input.status,
      input.createdBy,
      input.lastLogin ?? null,
      input.lastPasswordReset ?? null,
      input.updatedBy ?? input.createdBy,
      JSON.stringify(input.rawPayload ?? {})
    ]
  )

  return mapRow(result.rows[0])
}

const mapRow = (row: Record<string, unknown>): UserRecord => {
  return {
    id: String(row.id),
    display_name: String(row.display_name ?? ''),
    email: String(row.email ?? ''),
    role: String(row.role ?? ''),
    status: String(row.status ?? ''),
    created_at: row.created_at as Date,
    created_by: String(row.created_by ?? ''),
    last_login: (row.last_login as Date | null) ?? null,
    last_password_reset: (row.last_password_reset as Date | null) ?? null,
    updated_at: row.updated_at as Date,
    updated_by: String(row.updated_by ?? ''),
    raw_payload: (row.raw_payload as Record<string, unknown>) ?? {}
  }
}

export const getUserById = async (id: string): Promise<UserRecord | null> => {
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

export const getUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    where email = $1
    limit 1`,
    [email]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const listUsers = async (): Promise<UserRecord[]> => {
  const result = await postgresPool.query(
    `select *
    from ${TABLE_NAME}
    order by display_name asc, email asc`
  )

  return result.rows.map(mapRow)
}

export const createUser = async (input: CreateUserInput): Promise<UserRecord> => {
  const result = await postgresPool.query(
    `insert into ${TABLE_NAME} (
      id,
      display_name,
      email,
      role,
      status,
      created_by,
      last_login,
      last_password_reset,
      updated_by,
      raw_payload
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    returning *`,
    [
      input.id,
      input.displayName,
      input.email,
      input.role,
      input.status,
      input.createdBy,
      input.lastLogin ?? null,
      input.lastPasswordReset ?? null,
      input.updatedBy ?? input.createdBy,
      input.rawPayload ? JSON.stringify(input.rawPayload) : '{}'
    ]
  )

  return mapRow(result.rows[0])
}

export const updateUser = async (
  id: string,
  input: UpdateUserInput
): Promise<UserRecord | null> => {
  const result = await postgresPool.query(
    `update ${TABLE_NAME}
    set
      display_name = coalesce($2, display_name),
      email = coalesce($3, email),
      role = coalesce($4, role),
      status = coalesce($5, status),
      last_login = coalesce($6, last_login),
      last_password_reset = coalesce($7, last_password_reset),
      updated_by = coalesce($8, updated_by),
      raw_payload = coalesce($9::jsonb, raw_payload)
    where id = $1
    returning *`,
    [
      id,
      input.displayName ?? null,
      input.email ?? null,
      input.role ?? null,
      input.status ?? null,
      input.lastLogin ?? null,
      input.lastPasswordReset ?? null,
      input.updatedBy ?? null,
      input.rawPayload ? JSON.stringify(input.rawPayload) : null
    ]
  )

  if (!result.rows.length) return null

  return mapRow(result.rows[0])
}

export const deleteUser = async (id: string): Promise<boolean> => {
  const result = await postgresPool.query(
    `delete from ${TABLE_NAME}
    where id = $1`,
    [id]
  )

  return result.rowCount === 1
}