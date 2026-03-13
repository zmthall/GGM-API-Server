import { postgresPool } from '../../../config/postgres'

import {
  createJobDescription,
  getJobDescriptionById,
  listJobDescriptions,
  updateJobDescription,
  deleteJobDescription
} from './jobDescriptions.db'

const TEST_ID = 'test-driver-role'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createJobDescription({
      id: TEST_ID,
      title: 'Driver',
      description: 'Responsible for transporting passengers safely.',
      responsibilities: 'Operate vehicle, assist passengers, maintain schedule.',
      qualifications: 'Valid drivers license, clean driving record.',
      selectLabel: 'Driver',
      shifts: 'Day / Evening'
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getJobDescriptionById(TEST_ID)
    console.log(byId)

    console.log('\n--- LIST ---')

    const list = await listJobDescriptions()
    console.log(list)

    console.log('\n--- UPDATE ---')

    const updated = await updateJobDescription(TEST_ID, {
      shifts: 'Day / Evening / Weekend'
    })

    console.log(updated)

    console.log('\n--- DELETE ---')

    const deleted = await deleteJobDescription(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE ---')

    const verify = await getJobDescriptionById(TEST_ID)
    console.log('Should be null:', verify)
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()