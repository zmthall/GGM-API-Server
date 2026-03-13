import { getAllDocuments } from '../../../../helpers/firebase'
import { upsertJobDescription } from '../../jobDescriptions/jobDescriptions.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreJobDescriptionDocument {
  id: string
  title?: string
  description?: string
  responsibilities?: string
  qualifications?: string
  select?: string
  shifts?: string
}

const FIRESTORE_COLLECTION = 'job_descriptions'

export const migrateJobDescriptions = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateJobDescriptions',
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
        const jobDescription = doc as FirestoreJobDescriptionDocument

        if (!jobDescription.id) {
          result.skippedCount++
          result.errors.push('Skipped job description with missing id.')
          continue
        }

        if (!jobDescription.title) {
          result.skippedCount++
          result.errors.push(`Skipped job description ${jobDescription.id}: missing title.`)
          continue
        }

        await upsertJobDescription({
          id: jobDescription.id,
          title: jobDescription.title,
          description: jobDescription.description ?? '',
          responsibilities: jobDescription.responsibilities ?? '',
          qualifications: jobDescription.qualifications ?? '',
          selectLabel: jobDescription.select ?? '',
          shifts: jobDescription.shifts ?? '',
          rawPayload: { ...jobDescription }
        })

        result.migratedCount++
      } catch (error) {
        result.errors.push(
          `Failed migrating job description ${(doc as { id?: string }).id ?? 'unknown'}: ${(error as Error).message}`
        )
      }
    }

    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}