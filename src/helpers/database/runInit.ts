import { postgresPool } from '../../config/postgres'
import { initDatabase } from './initDatabase'

const run = async (): Promise<void> => {
  try {
    await initDatabase()
    console.log('Database schema initialization completed successfully.')
  } catch (error) {
    console.error('Database schema initialization failed.')
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()