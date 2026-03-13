import { getDocument } from '../../../../helpers/firebase'
import {
  upsertCorrespondenceCounts
} from '../../adminMeta/correspondenceCounts.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreCorrespondenceCountsDocument {
  id: string
  applicationsNew?: number
  messagesNew?: number
  rideRequestsNew?: number
  updatedAt?: string
  createdAt?: string
}

const FIRESTORE_COLLECTION = 'admin_meta'
const FIRESTORE_DOCUMENT_ID = 'correspondence_counts'

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

export const migrateCorrespondenceCounts = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateCorrespondenceCounts',
    sourceCollection: FIRESTORE_COLLECTION,
    fetchedCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: []
  }

  try {
    const firestoreDoc = await getDocument<FirestoreCorrespondenceCountsDocument>(
      FIRESTORE_COLLECTION,
      FIRESTORE_DOCUMENT_ID
    )

    if (!firestoreDoc) {
      result.skippedCount = 1
      result.errors.push(
        `Document not found: ${FIRESTORE_COLLECTION}/${FIRESTORE_DOCUMENT_ID}`
      )
      return result
    }

    result.fetchedCount = 1

    await upsertCorrespondenceCounts({
      applicationsNew: toSafeNumber(firestoreDoc.applicationsNew),
      messagesNew: toSafeNumber(firestoreDoc.messagesNew),
      rideRequestsNew: toSafeNumber(firestoreDoc.rideRequestsNew),
      createdAt: toDateOrNull(firestoreDoc.createdAt),
      updatedAt: toDateOrNull(firestoreDoc.updatedAt),
      rawPayload: firestoreDoc as unknown as Record<string, unknown>
    })

    result.migratedCount = 1
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}