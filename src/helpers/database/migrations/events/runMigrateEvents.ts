import { postgresPool } from '../../../../config/postgres'
import { migrateEvents } from './migrateEvents'

const run = async (): Promise<void> => {
  try {
    const result = await migrateEvents()
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