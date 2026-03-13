import { postgresPool } from '../../../config/postgres'
import {
  createRideRequest,
  getRideRequestById,
  listRideRequests,
  listRideRequestsByStatus,
  updateRideRequest,
  deleteRideRequest
} from './rideRequests.db'

const TEST_ID = 'test-ride-request-001'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createRideRequest({
      id: TEST_ID,
      acknowledge: true,
      aptDate: '2099-01-01',
      aptTime: new Date('2099-01-01T21:00:00.000Z'),
      contactType: 'Ride Request',
      dob: 'encrypted-dob',
      dropoffAddress: 'encrypted-dropoff',
      email: 'encrypted-email',
      emailSentAt: new Date('2099-01-01T18:00:00.000Z'),
      emailStatus: 'email_sent',
      medId: 'encrypted-med-id',
      messageId: '<test-message-id@example.com>',
      name: 'encrypted-name',
      notes: '',
      phone: 'encrypted-phone',
      pickupAddress: 'encrypted-pickup',
      status: 'completed',
      tags: ['test', 'ride-request']
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getRideRequestById(TEST_ID)
    console.log(byId)

    console.log('\n--- LIST ALL ---')

    const list = await listRideRequests()
    console.log(list)

    console.log('\n--- LIST BY STATUS ---')

    const byStatus = await listRideRequestsByStatus('completed')
    console.log(byStatus)

    console.log('\n--- UPDATE ---')

    const updated = await updateRideRequest(TEST_ID, {
      status: 'closed',
      emailStatus: 'reviewed',
      notes: 'Updated test notes.'
    })

    console.log(updated)

    console.log('\n--- DELETE ---')

    const deleted = await deleteRideRequest(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE ---')

    const verify = await getRideRequestById(TEST_ID)
    console.log('Should be null:', verify)
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()