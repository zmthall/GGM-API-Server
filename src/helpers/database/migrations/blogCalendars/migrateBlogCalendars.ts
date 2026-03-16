import { getAllDocuments } from '../../../../helpers/firebase'
import { toSafeString } from '../../../safe'
import { upsertBlogCalendar } from '../../blogCalendars/blogCalendars.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreBlogCalendarDocument {
  id: string
  key?: string
  csv?: string
  createdAt?: string
  updatedAt?: string
}

const FIRESTORE_COLLECTION = 'blog-calendars'

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = new Date(toSafeString(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const migrateBlogCalendars = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateBlogCalendars',
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
        const blogCalendar = doc as FirestoreBlogCalendarDocument

        if (!blogCalendar.id) {
          result.skippedCount++
          result.errors.push('Skipped blog calendar with missing id.')
          continue
        }

        if (!blogCalendar.key) {
          result.skippedCount++
          result.errors.push(`Skipped blog calendar ${blogCalendar.id}: missing key.`)
          continue
        }

        await upsertBlogCalendar({
          id: blogCalendar.id,
          calendarKey: blogCalendar.key,
          csv: blogCalendar.csv ?? '',
          createdAt: toDateOrNull(blogCalendar.createdAt) ?? undefined,
          updatedAt: toDateOrNull(blogCalendar.updatedAt) ?? undefined,
          rawPayload: { ...blogCalendar }
        })

        result.migratedCount++
      } catch (error) {
        result.errors.push(
          `Failed migrating blog calendar ${(doc as { id?: string }).id ?? 'unknown'}: ${(error as Error).message}`
        )
      }
    }

    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}