import admin from 'firebase-admin'
import { CorrespondenceStatus, NotificationCounts, NotificationCountsDoc, CorrespondenceType } from '../types/notification'

const db = admin.firestore()

// Firestore location for the single counters document
const COUNTS_COLLECTION = 'admin_meta'
const COUNTS_DOC_ID = 'correspondence_counts'

const countsRef = () => db.collection(COUNTS_COLLECTION).doc(COUNTS_DOC_ID)

const FIELD_BY_TYPE: Record<CorrespondenceType, keyof NotificationCountsDoc> = {
  ride_requests: 'rideRequestsNew',
  messages: 'messagesNew',
  applications: 'applicationsNew'
}

const toNumber = (v: unknown) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

const normalizeStatus = (v: unknown) => String(v ?? '').trim().toLowerCase()

const normalizeCounts = (data: Partial<NotificationCountsDoc> | null | undefined) => {
  const rideRequestsNew = toNumber(data?.rideRequestsNew)
  const messagesNew = toNumber(data?.messagesNew)
  const applicationsNew = toNumber(data?.applicationsNew)

  return {
    rideRequestsNew,
    messagesNew,
    applicationsNew,
    totalNew: rideRequestsNew + messagesNew + applicationsNew
  }
}

const ensureCountsDocExists = async () => {
  const ref = countsRef()
  const snap = await ref.get()
  if (snap.exists) return

  await ref.set(
    {
      rideRequestsNew: 0,
      messagesNew: 0,
      applicationsNew: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  )
}

export const getAllNotificationCounts = async (): Promise<NotificationCounts> => {
  await ensureCountsDocExists()

  const snap = await countsRef().get()
  const data = snap.data() as NotificationCountsDoc

  const base = normalizeCounts(data)

  return {
    ...base,
    updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined
  }
}

const adjustNotificationCount = async (type: CorrespondenceType, delta: number): Promise<void> => {
  await ensureCountsDocExists()

  const field = FIELD_BY_TYPE[type]
  const ref = countsRef()

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = (snap.data() ?? {}) as Partial<NotificationCountsDoc>

    const currentValue = toNumber((data as any)[field])
    const nextValue = Math.max(0, currentValue + delta)

    tx.set(
      ref,
      {
        [field]: nextValue,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    )
  })
}

// Helper: call from other services after create
export const increaseNotificationCount = async (type: CorrespondenceType, amount = 1): Promise<void> => {
  const n = Math.max(1, Math.floor(Number(amount) || 1))
  await adjustNotificationCount(type, n)
}

// Helper: call from other services after status change out of "new"
export const decreaseNotificationCount = async (type: CorrespondenceType, amount = 1): Promise<void> => {
  const n = Math.max(1, Math.floor(Number(amount) || 1))
  await adjustNotificationCount(type, -n)
}

// Helper: call from other services when status changes
export const syncNotificationCountOnStatusChange = async (
  type: CorrespondenceType,
  prevStatus: CorrespondenceStatus | string | undefined,
  nextStatus: CorrespondenceStatus | string | undefined
): Promise<void> => {
  const prev = normalizeStatus(prevStatus)
  const next = normalizeStatus(nextStatus)

  if (prev !== 'new' && next === 'new') {
    await increaseNotificationCount(type, 1)
    return
  }

  if (prev === 'new' && next !== 'new') {
    await decreaseNotificationCount(type, 1)
    return
  }
}