import { postgresPool } from '../../../config/postgres'
import { consultationRequestsSchema } from '../schema/consultationRequests/consultationRequest.schema'

const run = async (): Promise<void> => {
  try {
    console.log(`Running schema: ${consultationRequestsSchema.key}`)

    for (const statement of consultationRequestsSchema.statements) {
      console.log('Running statement...')
      await postgresPool.query(statement)
    }

    console.log('Consultation requests schema created/updated successfully.')
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()