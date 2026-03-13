import { postgresPool } from '../../../../config/postgres'
import { migrateCorrespondenceCounts } from './migrateCorrespondenceCounts'

const run = async (): Promise<void> => {
  try {
    const result = await migrateCorrespondenceCounts()
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