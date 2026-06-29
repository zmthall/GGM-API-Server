import { CondensedConsultationData } from "../types/consultationForm"
import { randomUUID } from 'node:crypto'
import { cryptoService } from "./crypto.services"
import * as EmailService from '../services/email.services'
import {
  createConsultationRequest,
  updateConsultationRequest,
  getConsultationRequestById as dbGetConsultationRequestById,
  deleteConsultationRequest as dbDeleteConsultationRequest,
  listConsultationRequests
} from "../helpers/database/consultationRequests/consultationRequests.db" 
import type { ConsultationFormStatus, ConsultationMessageRecord } from '../types/consultationForm'
import { PaginatedResult, PaginationOptions } from "../types/pagination"
import { ConsultationRequestPDFGenerator } from '../helpers/pdfGenerator/consultationRequestPDFGenerator'
import {
  increaseNotificationCount,
  syncNotificationCountOnStatusChange,
  syncNotificationCountOnDelete
} from "./notification.services"

const applyFilters = <T>(
  items: T[],
  filters: Record<string, unknown>
): T[] => {
  return items.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true

      const itemValue = item[key as keyof T]
      return itemValue === value
    })
  })
}

const applyOmitSpam = <T extends { status: string }>(
  items: T[],
  omit: boolean
): T[] => {
  if (!omit) return items

  return items.filter(item => {
    return !['spam'].includes(item.status.toLowerCase())
  })
}

const paginateItems = <T>(
  items: T[],
  options: PaginationOptions = {}
): PaginatedResult<T> => {
  const currentPage = Math.max(1, options.page ?? 1)
  const pageSize = Math.max(1, options.pageSize ?? 5)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize

  return {
    data: items.slice(start, end),
    pagination: {
      currentPage,
      pageSize,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      totalPages,
      totalItems,
    },
  }
}

export const submitConsultationForm = async (
  consultationData: CondensedConsultationData
) => {
  const results: {
    success: boolean
    emailSuccess: boolean
    documentId?: string
    messageId?: string
    emailError?: string
  } = {
    success: true,
    emailSuccess: false,
    documentId: undefined,
    messageId: undefined,
  }

  const encryptedData = cryptoService.encryptConsultation(consultationData)

  try {
    const created = await createConsultationRequest({
      id: randomUUID(),
      contact_type: 'Consultation Form',
      createdAt: new Date(),

      first_name: encryptedData.first_name,
      last_name: encryptedData.last_name,
      email: encryptedData.email,
      phone: encryptedData.phone,
      contact_method: encryptedData.contact_method,

      person_seeking_care: encryptedData.person_seeking_care,
      age_range: encryptedData.age_range,
      insurance_type: encryptedData.insurance_type,
      questions: encryptedData.questions,
      placement: encryptedData.placement,

      message: encryptedData.message,

      emailSentAt: null,
      emailStatus: 'pending',
      messageId: '',
      status: 'new',
      tags: [],
      rawPayload: {},
    })

    results.documentId = created.id

    try {
      await increaseNotificationCount('consultation_requests', 1)
    } catch (err) {
      console.error('Failed to increment consultation notification count:', err)
    }
  } catch (error) {
    throw new Error(`Failed to save consultation request: ${(error as Error).message}`)
  }

  try {
    const emailResult = await EmailService.sendConsultationRequestEmail(consultationData)

    if (emailResult.success) {
      results.messageId = emailResult.messageId
      results.emailSuccess = true
    } else {
      results.emailError = emailResult.error
      results.emailSuccess = false
    }
  } catch (error) {
    results.emailError = (error as Error).message
    results.emailSuccess = false
  }

  try {
    if (results.documentId) {
      await updateConsultationRequest(
        results.documentId,
        results.emailSuccess
          ? {
              emailStatus: 'email_sent',
              emailSentAt: new Date(),
              messageId: results.messageId ?? '',
            }
          : {
              emailStatus: 'email_failed',
              emailError: results.emailError ?? 'Unknown email error',
              emailFailedAt: new Date(),
            }
      )
    }
  } catch (error) {
    throw new Error(`Failed to update consultation request status: ${(error as Error).message}`)
  }

  return results
}

export const getAllConsultationRequests = async (
  filters: Record<string, unknown> = {},
  omit: boolean = true,
  options: PaginationOptions = {}
): Promise<PaginatedResult<ConsultationMessageRecord>> => {
  try {
    const records = await listConsultationRequests()
    const decrypted = cryptoService.decryptConsultations(records) as ConsultationMessageRecord[]
    const filtered = applyOmitSpam(applyFilters(decrypted, filters), omit)

    return paginateItems(filtered, options)
  } catch (error) {
    throw new Error(`Failed to get consultation requests: ${(error as Error).message}`)
  }
}

export const getConsultationRequestById = async (id: string) => {
  const result = await dbGetConsultationRequestById(id)

  if (!result) {
    throw new Error('Consultation request not found')
  }

  return cryptoService.decryptConsultation(result)
}

export const updateConsultationRequestStatus = async (
  id: string,
  status: ConsultationFormStatus
) => {
  const existing = await dbGetConsultationRequestById(id)

  if (!existing) {
    throw new Error('Consultation request not found')
  }

  const result = await updateConsultationRequest(id, { status })

  if (!result) {
    throw new Error('Consultation request not found')
  }

  try {
    await syncNotificationCountOnStatusChange(
      'consultation_requests',
      existing.status,
      status
    )
  } catch {
    console.error('Failed to sync consultation notification count on status change')
  }

  return cryptoService.decryptConsultation(result)
}

export const updateConsultationRequestTags = async (
  id: string,
  tags: string[]
) => {
  const result = await updateConsultationRequest(id, { tags })

  if (!result) {
    throw new Error('Consultation request not found')
  }

  return cryptoService.decryptConsultation(result)
}

export const deleteConsultationRequest = async (id: string) => {
  const existing = await dbGetConsultationRequestById(id)

  if (!existing) {
    throw new Error('Consultation request not found')
  }

  const deleted = await dbDeleteConsultationRequest(id)

  if (!deleted) {
    throw new Error('Consultation request not found')
  }

  try {
    await syncNotificationCountOnDelete(
      'consultation_requests',
      existing.status
    )
  } catch (err) {
    console.error('Failed to sync consultation notification count on delete:', err)
  }

  return deleted
}

export const createConsultationRequestPDFById = async (
  id: string
): Promise<Buffer> => {
  try {
    const consultationRequest = await getConsultationRequestById(id)

    return await ConsultationRequestPDFGenerator.createSinglePDF(
      consultationRequest
    )
  } catch (error) {
    throw new Error(
      `Failed to create consultation request PDF: ${(error as Error).message}`
    )
  }
}