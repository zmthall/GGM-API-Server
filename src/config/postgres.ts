import { Pool, type PoolConfig } from 'pg'
import 'dotenv/config';

const parseBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (value == null) return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const parseInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const postgresConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST,
  port: parseInteger(process.env.POSTGRES_PORT, 5432),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD ?? '',
  max: parseInteger(process.env.POSTGRES_POOL_MAX, 10),
  idleTimeoutMillis: parseInteger(process.env.POSTGRES_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: parseInteger(process.env.POSTGRES_CONNECT_TIMEOUT_MS, 10000),
  ssl: parseBoolean(process.env.POSTGRES_SSL, false) ? { rejectUnauthorized: false } : false
}

export const postgresPool = new Pool(postgresConfig)

export const testPostgresConnection = async (): Promise<void> => {
  const client = await postgresPool.connect()

  try {
    await client.query('select 1')
  } finally {
    client.release()
  }
}