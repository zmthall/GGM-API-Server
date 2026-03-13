import { postgresPool } from '../../config/postgres'

const testDatabaseConnection = async (): Promise<void> => {
  const client = await postgresPool.connect()

  try {
    const result = await client.query<{
      now: string
      current_database: string
      current_user: string
      version: string
    }>(`
      select
        now() as now,
        current_database() as current_database,
        current_user as current_user,
        version() as version
    `)

    console.log('PostgreSQL connection successful.')
    console.log(result.rows[0])
  } finally {
    client.release()
  }
}

const run = async (): Promise<void> => {
  try {
    await testDatabaseConnection()
  } catch (error) {
    console.error('PostgreSQL connection failed.')
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()