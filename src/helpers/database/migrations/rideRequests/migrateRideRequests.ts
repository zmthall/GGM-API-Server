import { getAllDocuments } from '../../../../helpers/firebase'
import { upsertRideRequest } from '../../rideRequests/rideRequests.db'
import type { MigrationResult } from '../shared/migration.types'

interface FirestoreRideRequestDocument {
  id: string
  acknowledge?: boolean
  apt_date?: string
  apt_time?: string
  contact_type?: string
  created_at?: string
  dob?: string
  dropoff_address?: string
  email?: string
  email_sent_at?: string
  email_status?: string
  med_id?: string
  message_id?: string
  name?: string
  notes?: string
  phone?: string
  pickup_address?: string
  status?: string
  tags?: string[]
  updated_at?: string
}

const FIRESTORE_COLLECTION = 'ride_requests'

const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toDateStringOrNull = (value: unknown): string | null => {
  if (!value) return null
  const stringValue = String(value).trim()
  if (!stringValue) return null
  return stringValue
}

export const migrateRideRequests = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    migration: 'migrateRideRequests',
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
        const rideRequest = doc as FirestoreRideRequestDocument

        if (!rideRequest.id) {
          result.skippedCount++
          result.errors.push('Skipped ride request with missing id.')
          continue
        }

        await upsertRideRequest({
          id: rideRequest.id,
          acknowledge: rideRequest.acknowledge ?? false,
          aptDate: toDateStringOrNull(rideRequest.apt_date),
          aptTime: toDateOrNull(rideRequest.apt_time),
          contactType: rideRequest.contact_type ?? '',
          createdAt: toDateOrNull(rideRequest.created_at) ?? undefined,
          dob: rideRequest.dob ?? '',
          dropoffAddress: rideRequest.dropoff_address ?? '',
          email: rideRequest.email ?? '',
          emailSentAt: toDateOrNull(rideRequest.email_sent_at),
          emailStatus: rideRequest.email_status ?? '',
          medId: rideRequest.med_id ?? '',
          messageId: rideRequest.message_id ?? '',
          name: rideRequest.name ?? '',
          notes: rideRequest.notes ?? '',
          phone: rideRequest.phone ?? '',
          pickupAddress: rideRequest.pickup_address ?? '',
          status: rideRequest.status ?? '',
          tags: Array.isArray(rideRequest.tags) ? rideRequest.tags : [],
          rawPayload: { ...rideRequest }
        })

        result.migratedCount++
      } catch (error) {
        result.errors.push(
          `Failed migrating ride request ${(doc as { id?: string }).id ?? 'unknown'}: ${(error as Error).message}`
        )
      }
    }

    return result
  } catch (error) {
    result.errors.push((error as Error).message)
    return result
  }
}