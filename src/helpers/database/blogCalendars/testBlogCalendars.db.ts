import { postgresPool } from '../../../config/postgres'

import {
  createBlogCalendar,
  getBlogCalendarById,
  getBlogCalendarByKey,
  listBlogCalendars,
  updateBlogCalendar,
  deleteBlogCalendar
} from './blogCalendars.db'

const TEST_ID = 'test-calendar-001'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createBlogCalendar({
      id: TEST_ID,
      calendarKey: '2099-01',
      csv: 'Date,Title\n2099-01-01,Test Post'
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getBlogCalendarById(TEST_ID)
    console.log(byId)

    console.log('\n--- GET BY KEY ---')

    const byKey = await getBlogCalendarByKey('2099-01')
    console.log(byKey)

    console.log('\n--- LIST ---')

    const list = await listBlogCalendars()
    console.log(list)

    console.log('\n--- UPDATE ---')

    const updated = await updateBlogCalendar(TEST_ID, {
      csv: 'Date,Title\n2099-01-02,Updated Post'
    })

    console.log(updated)

    console.log('\n--- DELETE ---')

    const deleted = await deleteBlogCalendar(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE ---')

    const verify = await getBlogCalendarById(TEST_ID)
    console.log('Should be null:', verify)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()