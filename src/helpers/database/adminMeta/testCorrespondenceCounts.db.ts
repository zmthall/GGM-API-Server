import { postgresPool } from '../../../config/postgres'
import {
  getCorrespondenceCounts,
  incrementMessagesNew,
  decrementMessagesNew,
  resetCorrespondenceCounts
} from './correspondenceCounts.db'

const run = async (): Promise<void> => {
  try {
    console.log('Initial:', await getCorrespondenceCounts())
    console.log('Increment messages:', await incrementMessagesNew())
    console.log('Decrement messages:', await decrementMessagesNew())
    console.log('Reset:', await resetCorrespondenceCounts())
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()