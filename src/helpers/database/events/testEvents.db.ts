import { postgresPool } from '../../../config/postgres'
import {
  createEvent,
  getEventById,
  listEvents,
  listActiveEvents,
  updateEvent,
  deleteEvent
} from './events.db'

const TEST_ID = 'test-event-001'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createEvent({
      id: TEST_ID,
      address: '123 Main St, Pueblo, CO',
      archived: false,
      dateStart: new Date('2099-01-01T10:00:00.000Z'),
      dateTo: new Date('2099-01-01T12:00:00.000Z'),
      description: 'Test community event.',
      link: 'https://example.com/event',
      location: 'Community Center',
      title: 'Test Event'
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getEventById(TEST_ID)
    console.log(byId)

    console.log('\n--- LIST ALL ---')

    const list = await listEvents()
    console.log(list)

    console.log('\n--- LIST ACTIVE ---')

    const activeList = await listActiveEvents()
    console.log(activeList)

    console.log('\n--- UPDATE ---')

    const updated = await updateEvent(TEST_ID, {
      archived: true,
      title: 'Updated Test Event'
    })

    console.log(updated)

    console.log('\n--- DELETE ---')

    const deleted = await deleteEvent(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE ---')

    const verify = await getEventById(TEST_ID)
    console.log('Should be null:', verify)
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()