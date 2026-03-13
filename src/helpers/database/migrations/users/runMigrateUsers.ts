import { postgresPool } from '../../../../config/postgres'
import { migrateUsers } from './migrateUsers'

const run = async (): Promise<void> => {
  try {
    const result = await migrateUsers()
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Migration failed:')
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()