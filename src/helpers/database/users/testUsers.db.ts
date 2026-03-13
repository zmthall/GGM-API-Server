import { postgresPool } from '../../../config/postgres'
import {
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
  deleteUser
} from './users.db'

const TEST_ID = 'test-user-001'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createUser({
      id: TEST_ID,
      displayName: 'Test User',
      email: 'test-user@example.com',
      role: 'admin',
      status: 'active',
      createdBy: 'system'
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getUserById(TEST_ID)
    console.log(byId)

    console.log('\n--- GET BY EMAIL ---')

    const byEmail = await getUserByEmail('test-user@example.com')
    console.log(byEmail)

    console.log('\n--- LIST ---')

    const list = await listUsers()
    console.log(list)

    console.log('\n--- UPDATE ---')

    const updated = await updateUser(TEST_ID, {
      role: 'super_admin',
      status: 'enabled',
      updatedBy: 'system-update'
    })

    console.log(updated)

    console.log('\n--- DELETE ---')

    const deleted = await deleteUser(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE ---')

    const verify = await getUserById(TEST_ID)
    console.log('Should be null:', verify)
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()