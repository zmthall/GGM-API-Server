import { getAllDocuments } from '../../../../helpers/firebase'
import { upsertJobApplication } from '../../jobApplications/jobApplications.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreJobApplicationDocument {
  id: string
  contact_type?: string
  created_at?: string
  department?: string
  position?: string
  position_name?: string
  status?: string
  tags?: string[]
  updated_at?: string

  personal?: Record<string, unknown>
  driving?: Record<string, unknown>
  work?: Record<string, unknown>
  resume?: Record<string, unknown>
}

const FIRESTORE_COLLECTION = 'job_applications'

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export const migrateJobApplications = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateJobApplications',
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
        const application = doc as FirestoreJobApplicationDocument

        if (!application.id) {
          result.skippedCount++
          result.errors.push('Skipped job application with missing id.')
          continue
        }

        await upsertJobApplication({
          id: application.id,
          contactType: application.contact_type ?? 'Job Application',
          createdAt: toDateOrNull(application.created_at) ?? undefined,
          department: application.department ?? '',
          position: application.position ?? '',
          positionName: application.position_name ?? '',
          status: application.status ?? '',
          tags: Array.isArray(application.tags) ? application.tags : [],
          personalPayload: toObject(application.personal),
          drivingPayload: toObject(application.driving),
          workPayload: toObject(application.work),
          resumePayload: toObject(application.resume),
          rawPayload: { ...application }
        })

        result.migratedCount++
      } catch (error) {
        result.errors.push(
          `Failed migrating job application ${(doc as { id?: string }).id ?? 'unknown'}: ${(error as Error).message}`
        )
      }
    }

    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}