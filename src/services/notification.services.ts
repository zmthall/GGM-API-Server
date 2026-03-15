import {
  ensureCorrespondenceCountsExists,
  getCorrespondenceCounts,
  incrementApplicationsNew,
  incrementMessagesNew,
  incrementRideRequestsNew,
  decrementApplicationsNew,
  decrementMessagesNew,
  decrementRideRequestsNew
} from '../helpers/database/adminMeta/correspondenceCounts.db'
import { CorrespondenceStatus, NotificationCounts, CorrespondenceType } from '../types/notification'

const toNumber = (v: unknown) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

const normalizeStatus = (v: unknown) => String(v ?? '').trim().toLowerCase()

export const getAllNotificationCounts = async (): Promise<NotificationCounts> => {
  await ensureCorrespondenceCountsExists()
  const data = await getCorrespondenceCounts()

  const rideRequestsNew = toNumber(data.ride_requests_new)
  const messagesNew = toNumber(data.messages_new)
  const applicationsNew = toNumber(data.applications_new)

  return {
    rideRequestsNew,
    messagesNew,
    applicationsNew,
    totalNew: rideRequestsNew + messagesNew + applicationsNew,
    updatedAt: data?.updated_at?.toISOString?.()
  }
}

const adjustNotificationCount = async (type: CorrespondenceType, delta: number): Promise<void> => {
  await ensureCorrespondenceCountsExists()

  const amount = Math.max(1, Math.floor(Math.abs(Number(delta) || 1)))

  if (delta > 0) {
    if (type === 'ride_requests') {
      await incrementRideRequestsNew(amount)
      return
    }

    if (type === 'messages') {
      await incrementMessagesNew(amount)
      return
    }

    if (type === 'applications') {
      await incrementApplicationsNew(amount)
    }

    return
  }

  if (type === 'ride_requests') {
    await decrementRideRequestsNew(amount)
    return
  }

  if (type === 'messages') {
    await decrementMessagesNew(amount)
    return
  }

  if (type === 'applications') {
    await decrementApplicationsNew(amount)
  }
}

export const increaseNotificationCount = async (type: CorrespondenceType, amount = 1): Promise<void> => {
  const n = Math.max(1, Math.floor(Number(amount) || 1))
  await adjustNotificationCount(type, n)
}

export const decreaseNotificationCount = async (type: CorrespondenceType, amount = 1): Promise<void> => {
  const n = Math.max(1, Math.floor(Number(amount) || 1))
  await adjustNotificationCount(type, -n)
}

export const syncNotificationCountOnStatusChange = async (
  type: CorrespondenceType,
  prevStatus: CorrespondenceStatus | string  | undefined,
  nextStatus: CorrespondenceStatus | string | undefined
): Promise<void> => {
  const prev = normalizeStatus(prevStatus)
  const next = normalizeStatus(nextStatus)

  if (prev !== 'new' && next === 'new') {
    await increaseNotificationCount(type, 1)
  }

  if (prev === 'new' && next !== 'new') {
    await decreaseNotificationCount(type, 1)
  }
}