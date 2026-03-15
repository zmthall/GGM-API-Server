import { randomUUID } from 'node:crypto'
import { Zippper } from '../helpers/fileZip'
import { RideRequestPDFGenerator } from '../helpers/pdfGenerator/rideRequestPDFGenerator'
import type { RideRequestData, RideRequestDocument, RideRequestStatus } from '../types/rideRequest'
import type { PaginatedResult, PaginationOptions } from '../types/pagination'
import type { PDFFile } from '../types/PDF'
import { cryptoService } from './crypto.services'
import * as EmailService from './email.services'
import { increaseNotificationCount, syncNotificationCountOnStatusChange } from './notification.services'
import { NOTIFICATION_TYPE_BY_COLLECTION } from '../config/notification'
import {
  createRideRequest,
  deleteRideRequest as deleteRideRequestRecord,
  getRideRequestById as getRideRequestRecordById,
  listRideRequests,
  updateRideRequest
} from '../helpers/database/rideRequests/rideRequests.db'

const COLLECTION = 'ride_requests'

const parseYyyyMmDdAsUtcRange = (date: string) => {
  const [year, month, day] = date.split('-')
  const startDate = new Date(Date.UTC(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), 23, 59, 59, 999))
  return { startDate, endDate }
}

const applyFilters = (
  items: RideRequestDocument[],
  filters: Record<string, unknown> = {}
): RideRequestDocument[] => {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true
      return (item as unknown as Record<string, unknown>)[key] === value
    })
  })
}

const applyOmitSpam = (items: RideRequestDocument[], omit: boolean): RideRequestDocument[] => {
  if (!omit) return items
  return items.filter((item) => item.status !== 'spam')
}

const paginateItems = <T>(items: T[], options: PaginationOptions = {}): PaginatedResult<T> => {
  const currentPage = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.max(1, Number(options.pageSize) || 5)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const data = items.slice(startIndex, startIndex + pageSize)

  return {
    data,
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    }
  }
}

const mapRideRequestRecordToDocument = (
  record: Awaited<ReturnType<typeof getRideRequestRecordById>> extends infer T
    ? T extends null
      ? never
      : T
    : never
): RideRequestDocument => {
  return {
    id: record.id,
    acknowledge: record.acknowledge,
    apt_date: record.apt_date ?? '',
    apt_time: record.apt_time ? record.apt_time.toISOString() : '',
    contact_type: record.contact_type,
    created_at: record.created_at.toISOString(),
    dob: record.dob,
    dropoff_address: record.dropoff_address,
    email: record.email,
    email_sent_at: record.email_sent_at ? record.email_sent_at.toISOString() : '',
    email_status: record.email_status,
    med_id: record.med_id,
    message_id: record.message_id,
    name: record.name,
    notes: record.notes,
    phone: record.phone,
    pickup_address: record.pickup_address,
    status: record.status as RideRequestStatus,
    tags: record.tags,
    updated_at: record.updated_at.toISOString()
  }
}

export const submitRideRequestForm = async (rideData: RideRequestData) => {
  const results: {
    success: boolean
    emailSuccess: boolean
    documentId?: string
    messageId?: string
    emailError?: string
  } = {
    success: false,
    emailSuccess: false,
    documentId: undefined,
    messageId: undefined,
    emailError: undefined
  }

  const encryptedData = cryptoService.encryptRideRequest(rideData)

  const saveResult = await createRideRequest({
    id: randomUUID(),
    acknowledge: Boolean(encryptedData.acknowledge),
    aptDate: encryptedData.apt_date ?? null,
    aptTime: encryptedData.apt_time ? new Date(encryptedData.apt_time) : null,
    contactType: 'Ride Request',
    createdAt: new Date(),
    dob: encryptedData.dob,
    dropoffAddress: encryptedData.dropoff_address,
    email: encryptedData.email,
    emailSentAt: null,
    emailStatus: 'pending',
    medId: encryptedData.med_id,
    messageId: '',
    name: encryptedData.name,
    notes: encryptedData.notes ?? '',
    phone: encryptedData.phone,
    pickupAddress: encryptedData.pickup_address,
    status: 'new',
    tags: [],
    rawPayload: {}
  })

  if (saveResult?.id) {
    await increaseNotificationCount(NOTIFICATION_TYPE_BY_COLLECTION[COLLECTION], 1)
  }

  if (!saveResult?.id) {
    throw new Error('Failed to save ride request (no document id returned)')
  }

  results.success = true
  results.documentId = saveResult.id

  let emailResult:
    | { success: true; messageId?: string }
    | { success: false; error?: string }

  try {
    emailResult = await EmailService.sendRideRequestEmail(rideData)
  } catch (err) {
    emailResult = { success: false, error: (err as Error).message }
  }

  if (emailResult.success) {
    results.emailSuccess = true
    results.messageId = emailResult.messageId
  } else {
    results.emailSuccess = false
    results.emailError = emailResult.error || 'Unknown email error'
  }

  await updateRideRequest(
    saveResult.id,
    results.emailSuccess
      ? {
          emailStatus: 'email_sent',
          emailSentAt: new Date(),
          ...(results.messageId ? { messageId: results.messageId } : {})
        }
      : {
          emailStatus: 'email_failed',
          ...(results.emailError ? { rawPayload: { email_error: results.emailError } } : {})
        }
  )

  return results
}

export const getAllRideRequests = async (
  filters: Record<string, unknown> = {},
  omit: boolean = true,
  options: PaginationOptions = {}
): Promise<PaginatedResult<RideRequestDocument>> => {
  try {
    const records = await listRideRequests()
    const documents = records.map(mapRideRequestRecordToDocument)
    const decrypted = cryptoService.decryptRideRequests(documents)
    const filtered = applyOmitSpam(applyFilters(decrypted, filters), omit)
    return paginateItems(filtered, options)
  } catch (error) {
    throw new Error(`Failed to get ride requests: ${(error as Error).message}`)
  }
}

export const getRideRequestById = async (id: string): Promise<RideRequestDocument> => {
  try {
    const result = await getRideRequestRecordById(id)

    if (!result) {
      throw new Error('Ride request not found')
    }

    return cryptoService.decryptRideRequest(mapRideRequestRecordToDocument(result))
  } catch (error) {
    throw new Error(`Failed to get ride request: ${(error as Error).message}`)
  }
}

export const getRideRequestsByDate = async (
  date: string,
  filters: Record<string, unknown> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<RideRequestDocument>> => {
  try {
    const { startDate, endDate } = parseYyyyMmDdAsUtcRange(date)
    const records = await listRideRequests()
    const documents = records.map(mapRideRequestRecordToDocument)
    const decryptedData = cryptoService.decryptRideRequests(documents)

    const filteredByDate = decryptedData.filter((item) => {
      const createdAt = new Date(item.created_at)
      return createdAt >= startDate && createdAt <= endDate
    })

    const filtered = applyFilters(filteredByDate, filters)
    return paginateItems(filtered, options)
  } catch (error) {
    throw new Error(`Failed to get ride requests by date: ${(error as Error).message}`)
  }
}

export const updateRideRequestStatus = async (
  id: string,
  status: 'new' | 'completed' | 'reviewing' | 'declined' | 'spam'
): Promise<{ id: string; status: string; updated_at: string }> => {
  try {
    const existing = await getRideRequestRecordById(id)
    const prevStatus = existing?.status

    const result = await updateRideRequest(id, {
      status
    })

    if (!result) {
      throw new Error('Ride request not found')
    }

    await syncNotificationCountOnStatusChange('ride_requests', prevStatus, status)

    return {
      id: result.id,
      status: result.status,
      updated_at: result.updated_at.toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to update ride request status: ${(error as Error).message}`)
  }
}

export const updateRideRequestTags = async (
  id: string,
  newTags: string[]
): Promise<{ id: string; tags: string[]; updated_at: string }> => {
  try {
    const existingRideRequest = await getRideRequestRecordById(id)

    if (!existingRideRequest) {
      throw new Error('Ride request not found')
    }

    const updatedTags = [...new Set(newTags)]

    const result = await updateRideRequest(id, {
      tags: updatedTags
    })

    if (!result) {
      throw new Error('Ride request not found')
    }

    return {
      id: result.id,
      tags: result.tags,
      updated_at: result.updated_at.toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to add tags to ride request: ${(error as Error).message}`)
  }
}

export const deleteRideRequest = async (id: string): Promise<void> => {
  try {
    const deleted = await deleteRideRequestRecord(id)
    if (!deleted) {
      throw new Error('Ride request not found')
    }
  } catch (error) {
    throw new Error(`Failed to delete ride request: ${(error as Error).message}`)
  }
}

export const createRideRequestPDFById = async (id: string): Promise<Buffer> => {
  try {
    const rideRequest = await getRideRequestById(id)
    return await RideRequestPDFGenerator.createSinglePDF(rideRequest)
  } catch (error) {
    throw new Error(`Failed to create ride request PDF: ${(error as Error).message}`)
  }
}

export const createRideRequestPDFBulk = async (ids: string[]): Promise<Buffer> => {
  try {
    const pdfFiles: PDFFile[] = []

    for (const id of ids) {
      const rideRequest = await getRideRequestById(id)
      const pdfBuffer = await RideRequestPDFGenerator.createSinglePDF(rideRequest)
      const filename = `ride-request-${rideRequest.name.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 8)}.pdf`

      pdfFiles.push({
        buffer: pdfBuffer,
        filename
      })
    }

    if (pdfFiles.length === 0) {
      throw new Error('No valid ride requests found for the provided IDs')
    }

    return await Zippper.createPDFZip(pdfFiles)
  } catch (error) {
    throw new Error(`Failed to create bulk ride request PDFs: ${(error as Error).message}`)
  }
}