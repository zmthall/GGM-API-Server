import { getDocument } from '../../../../helpers/firebase'
import { toSafeNullableDate, toSafeNumber, toSafeObject } from '../../../safe'
import {
  upsertCorrespondenceCounts
} from '../../adminMeta/correspondenceCounts.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreCorrespondenceCountsDocument {
  id: string
  messagesNew?: number
  rideRequestsNew?: number
  consultationRequestsNew?: number
  applicationsNew?: number
  updatedAt?: string
  createdAt?: string
}

const FIRESTORE_COLLECTION = 'admin_meta'
const FIRESTORE_DOCUMENT_ID = 'correspondence_counts'

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
      messagesNew: toSafeNumber(firestoreDoc.messagesNew),
      rideRequestsNew: toSafeNumber(firestoreDoc.rideRequestsNew),
      consultationRequestsNew: toSafeNumber(firestoreDoc.consultationRequestsNew),
      applicationsNew: toSafeNumber(firestoreDoc.applicationsNew),
      createdAt: toSafeNullableDate(firestoreDoc.createdAt),
      updatedAt: toSafeNullableDate(firestoreDoc.updatedAt),
      rawPayload: toSafeObject(firestoreDoc)
    })

    result.migratedCount = 1
    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}