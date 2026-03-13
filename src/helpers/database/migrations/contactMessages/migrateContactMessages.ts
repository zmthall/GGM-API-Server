import { getAllDocuments } from '../../../../helpers/firebase'
import { upsertContactMessage } from '../../contactMessages/contactMessages.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreContactMessageDocument {
  id: string
  contact_method?: string
  contact_type?: string
  created_at?: string
  email?: string
  email_sent_at?: string
  email_status?: string
  first_name?: string
  last_name?: string
  message?: string
  message_id?: string
  phone?: string
  reason?: string
  status?: string
  tags?: string[]
  updated_at?: string
}

const FIRESTORE_COLLECTION = 'contact_messages'

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const migrateContactMessages = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateContactMessages',
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
        const message = doc as FirestoreContactMessageDocument

        if (!message.id) {
          result.skippedCount++
          result.errors.push('Skipped contact message with missing id.')
          continue
        }

        await upsertContactMessage({
          id: message.id,
          contactMethod: message.contact_method ?? '',
          contactType: message.contact_type ?? '',
          createdAt: toDateOrNull(message.created_at) ?? undefined,
          email: message.email ?? '',
          emailSentAt: toDateOrNull(message.email_sent_at),
          emailStatus: message.email_status ?? '',
          firstName: message.first_name ?? '',
          lastName: message.last_name ?? '',
          message: message.message ?? '',
          messageId: message.message_id ?? '',
          phone: message.phone ?? '',
          reason: message.reason ?? '',
          status: message.status ?? '',
          tags: Array.isArray(message.tags) ? message.tags : [],
          rawPayload: { ...message }
        })

        result.migratedCount++
      } catch (error) {
        result.errors.push(
          `Failed migrating contact message ${(doc as { id?: string }).id ?? 'unknown'}: ${(error as Error).message}`
        )
      }
    }

    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}