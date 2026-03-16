import { getAllDocuments } from '../../../../helpers/firebase'
import { toSafeString } from '../../../safe'
import { upsertUser } from '../../users/users.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreUserDocument {
  id: string
  displayName?: string
  email?: string
  role?: string
  status?: string
  created_by?: string
  createdBy?: string
  lastLogin?: string
  lastPasswordReset?: string
  updated?: {
    at?: string
    by?: string
  }
}

const FIRESTORE_COLLECTION = 'users'

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = new Date(toSafeString(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const migrateUsers = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateUsers',
    sourceCollection: FIRESTORE_COLLECTION,
    fetchedCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: []
  }

  try {
    const firestoreDocs = await getAllDocuments(FIRESTORE_COLLECTION)
    result.fetchedCount = firestoreDocs.length

    for (const doc of firestoreDocs) {
      try {
        const user = doc as FirestoreUserDocument

        if (!user.id) {
          result.skippedCount++
          result.errors.push('Skipped user with missing id.')
          continue
        }

        if (!user.email) {
          result.skippedCount++
          result.errors.push(`Skipped user ${user.id}: missing email.`)
          continue
        }

        await upsertUser({
          id: user.id,
          displayName: user.displayName ?? '',
          email: user.email,
          role: user.role ?? '',
          status: user.status ?? '',
          createdBy: user.created_by ?? user.createdBy ?? '',
          lastLogin: toDateOrNull(user.lastLogin),
          lastPasswordReset: toDateOrNull(user.lastPasswordReset),
          updatedBy: user.updated?.by ?? user.created_by ?? user.createdBy ?? '',
          rawPayload: { ...user }
        })

        result.migratedCount++
      } catch (error) {
        result.errors.push(
          `Failed migrating user ${(doc as { id?: string }).id ?? 'unknown'}: ${(error as Error).message}`
        )
      }
    }

    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}