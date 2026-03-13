import { postgresPool } from '../../../config/postgres'
import {
  createContactMessage,
  getContactMessageById,
  listContactMessages,
  updateContactMessage,
  deleteContactMessage
} from './contactMessages.db'

const TEST_ID = 'test-contact-message'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createContactMessage({
      id: TEST_ID,
      contactMethod: 'email',
      contactType: 'Contact Form',
      email: 'test@example.com',
      emailStatus: 'pending',
      firstName: 'Test',
      lastName: 'User',
      message: 'Testing contact message.',
      messageId: '<test123@example.com>',
      phone: '7195551234',
      reason: 'question',
      status: 'new',
      tags: ['test']
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getContactMessageById(TEST_ID)
    console.log(byId)

    console.log('\n--- LIST ---')

    const list = await listContactMessages()
    console.log(list)

    console.log('\n--- UPDATE ---')

    const updated = await updateContactMessage(TEST_ID, {
      status: 'closed',
      emailStatus: 'email_sent'
    })

    console.log(updated)

    console.log('\n--- DELETE ---')

    const deleted = await deleteContactMessage(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE ---')

    const verify = await getContactMessageById(TEST_ID)
    console.log('Should be null:', verify)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()