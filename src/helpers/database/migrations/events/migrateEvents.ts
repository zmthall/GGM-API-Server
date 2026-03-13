import { getAllDocuments } from '../../../../helpers/firebase'
import { upsertEvent } from '../../events/events.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreEventDocument {
  id: string
  address?: string
  archived?: boolean
  date?: string
  date_start?: string
  dateTo?: string
  date_to?: string
  date_end?: string
  description?: string
  link?: string
  location?: string
  title?: string
}

const FIRESTORE_COLLECTION = 'events'

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const migrateEvents = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateEvents',
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
        const event = doc as FirestoreEventDocument

        if (!event.id) {
          result.skippedCount++
          result.errors.push('Skipped event with missing id.')
          continue
        }

        await upsertEvent({
          id: event.id,
          address: event.address ?? '',
          archived: event.archived ?? false,
          dateStart: toDateOrNull(event.date_start ?? event.date),
          dateEnd: toDateOrNull(event.date_end ?? event.date_to ?? event.dateTo),
          description: event.description ?? '',
          link: event.link ?? '',
          location: event.location ?? '',
          title: event.title ?? '',
          rawPayload: { ...event }
        })

        result.migratedCount++
      } catch (error) {
        result.errors.push(
          `Failed migrating event ${(doc as { id?: string }).id ?? 'unknown'}: ${(error as Error).message}`
        )
      }
    }

    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}