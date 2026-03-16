import { postgresPool } from '../../../config/postgres'
import {
  createJobApplication,
  getJobApplicationById,
  listJobApplications,
  listJobApplicationsByStatus,
  listJobApplicationsByDepartment,
  updateJobApplication,
  deleteJobApplication
} from './jobApplications.db'

const TEST_ID = 'test-job-application-001'

const run = async (): Promise<void> => {
  try {
    console.log('\n--- CREATE ---')

    const created = await createJobApplication({
      id: TEST_ID,
      contactType: 'Job Application',
      department: 'transportation',
      position: 'transportation_general',
      positionName: 'general',
      status: 'closed',
      tags: ['test', 'application'],
      personalPayload: {
        firstName: 'encrypted-first',
        lastName: 'encrypted-last',
        phoneNumber: 'encrypted-phone',
        address: 'encrypted-address',
        citizen: 'encrypted-citizen',
        felony: 'encrypted-felony',
        over18: 'encrypted-over18',
        select: 'encrypted-select'
      },
      drivingPayload: {
        hasAccidents: 'encrypted-has-accidents',
        accidents: '',
        hasEndorsements: 'encrypted-has-endorsements',
        endorsements: 'encrypted-endorsements',
        hasMVR: 'encrypted-has-mvr',
        MVR: {
          filename: '',
          url: ''
        },
        driversLicense: {
          filename: 'encrypted-license-file',
          url: 'encrypted-license-url'
        },
        hasTrafficConvictions: 'encrypted-traffic-convictions',
        trafficConvictions: ''
      },
      workPayload: {
        availability: '',
        dateAvailableToStart: 'encrypted-date',
        employmentType: 'encrypted-employment-type',
        hasWorkedAtGoldenGate: 'encrypted-worked-here',
        learnedAboutUs: 'encrypted-learned-about-us',
        otherExplain: 'encrypted-other-explain',
        preferablePayRate: 'encrypted-pay-rate',
        willingToWorkOvertime: 'encrypted-overtime'
      }
    })

    console.log(created)

    console.log('\n--- GET BY ID ---')

    const byId = await getJobApplicationById(TEST_ID)
    console.log(byId)

    console.log('\n--- LIST ALL ---')

    const list = await listJobApplications()
    console.log(list)

    console.log('\n--- LIST BY STATUS ---')

    const byStatus = await listJobApplicationsByStatus('closed')
    console.log(byStatus)

    console.log('\n--- LIST BY DEPARTMENT ---')

    const byDepartment = await listJobApplicationsByDepartment('transportation')
    console.log(byDepartment)

    console.log('\n--- UPDATE ---')

    const updated = await updateJobApplication(TEST_ID, {
      status: 'reviewed',
      tags: ['test', 'reviewed']
    })

    console.log(updated)

    console.log('\n--- DELETE ---')

    const deleted = await deleteJobApplication(TEST_ID)
    console.log('Deleted:', deleted)

    console.log('\n--- VERIFY DELETE ---')

    const verify = await getJobApplicationById(TEST_ID)
    console.log('Should be null:', verify)
  } catch (error) {
    console.error('Test failed:', error)
    process.exitCode = 1
  } finally {
    await postgresPool.end()
  }
}

void run()