import { randomUUID } from 'node:crypto'
import { Zippper } from '../helpers/fileZip'
import { ContactFormPDFGenerator } from '../helpers/pdfGenerator/contactFormPDFGenerator'
import { ContactFormData, ContactFormDocument, ContactFormStatus } from '../types/contactForm'
import { PaginatedResult, PaginationOptions } from '../types/pagination'
import { PDFFile } from '../types/PDF'
import { cryptoService } from './crypto.services'
import * as EmailService from '../services/email.services'
import { increaseNotificationCount, syncNotificationCountOnStatusChange } from './notification.services'
import { NOTIFICATION_TYPE_BY_COLLECTION } from '../config/notification'
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessageById,
  listContactMessages,
  updateContactMessage
} from '../helpers/database/contactMessages/contactMessages.db'

const COLLECTION = 'contact_messages'

const getValue = (obj: unknown, key: string): unknown => {
  return (obj as Record<string, unknown>)[key]
}

const parseMmDdYyyyAsUtcRange = (date: string) => {
  const [month, day, year] = date.split('-')
  const startDate = new Date(Date.UTC(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), 23, 59, 59, 999))
  return { startDate, endDate }
}

const applyFilters = (
  items: ContactFormDocument[],
  filters: Record<string, unknown> = {}
): ContactFormDocument[] => {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true
      return getValue(item, key) === value
    })
  })
}

const applyOmitSpam = (items: ContactFormDocument[], omit: boolean): ContactFormDocument[] => {
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

const mapContactRecordToDocument = (
  record: Awaited<ReturnType<typeof getContactMessageById>> extends infer T
    ? T extends null
      ? never
      : T
    : never
): ContactFormDocument => {
  return {
    id: record.id,
    contact_method: record.contact_method,
    contact_type: record.contact_type,
    created_at: record.created_at.toISOString(),
    email: record.email,
    email_sent_at: record.email_sent_at ? record.email_sent_at.toISOString() : '',
    email_status: record.email_status,
    first_name: record.first_name,
    last_name: record.last_name,
    message: record.message,
    message_id: record.message_id,
    phone: record.phone,
    reason: record.reason,
    status: record.status as ContactFormStatus,
    tags: record.tags,
    updated_at: record.updated_at.toISOString()
  }
}

export const submitContactForm = async (contactData: ContactFormData) => {
  const results: {
    success: boolean
    emailSuccess: boolean
    documentId: string | undefined
    messageId: string | undefined
    emailError?: string | undefined
  } = {
    success: true,
    emailSuccess: false,
    documentId: '',
    messageId: ''
  }

  const encryptedData = cryptoService.encryptContact(contactData)

  try {
    const created = await createContactMessage({
      id: randomUUID(),
      contactMethod: encryptedData.contact_method,
      contactType: 'Contact Form',
      createdAt: new Date(),
      email: encryptedData.email,
      emailSentAt: null,
      emailStatus: 'pending',
      firstName: encryptedData.first_name,
      lastName: encryptedData.last_name ?? '',
      message: encryptedData.message,
      messageId: '',
      phone: encryptedData.phone ?? '',
      reason: encryptedData.reason,
      status: 'new',
      tags: [],
      rawPayload: {}
    })

    results.documentId = created.id
    await increaseNotificationCount(NOTIFICATION_TYPE_BY_COLLECTION[COLLECTION], 1)
  } catch (error) {
    throw new Error(`Failed to save to database: {ERROR} - ${(error as Error).message}`)
  }

  try {
    const emailResult = await EmailService.sendContactFormEmail(contactData)
    if (emailResult.success) {
      results.messageId = emailResult.messageId
      results.emailSuccess = true
    } else {
      results.emailError = emailResult.error
      results.emailSuccess = false
    }
  } catch (error) {
    throw new Error(`Failed to send contact form email: {ERROR} - ${(error as Error).message}`)
  }

  try {
    if (results.documentId) {
      const updated = results.messageId !== ''
        ? {
            emailStatus: 'email_sent',
            emailSentAt: new Date(),
            ...(results.messageId ? { messageId: results.messageId } : {})
          }
        : {
            emailStatus: 'email_failed',
            ...(results.emailError ? { rawPayload: { email_error: results.emailError } } : {})
          }

      await updateContactMessage(results.documentId, updated)
    }
  } catch (error) {
    throw new Error(`Failed to update contact form status: {ERROR} - ${(error as Error).message}`)
  }

  return results
}

export const getAllContactForms = async (
  filters: Record<string, unknown> = {},
  omit: boolean = true,
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const records = await listContactMessages()
    const documents = records.map(mapContactRecordToDocument)
    const decryptedResults = cryptoService.decryptContacts(documents)
    const filtered = applyOmitSpam(applyFilters(decryptedResults, filters), omit)
    return paginateItems(filtered, options)
  } catch (error) {
    throw new Error(`Failed to get contact forms: ${(error as Error).message}`)
  }
}

export const getContactFormById = async (id: string): Promise<ContactFormDocument> => {
  try {
    const result = await getContactMessageById(id)

    if (!result) {
      throw new Error('Contact form not found')
    }

    const decryptedResult = cryptoService.decryptContact(mapContactRecordToDocument(result))
    return decryptedResult
  } catch (error) {
    throw new Error(`Failed to get contact form: ${(error as Error).message}`)
  }
}

export const getContactFormsByDate = async (
  date: string,
  filters: Record<string, unknown> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const { startDate, endDate } = parseMmDdYyyyAsUtcRange(date)
    const records = await listContactMessages()
    const documents = records.map(mapContactRecordToDocument)
    const decryptedData = cryptoService.decryptContacts(documents)

    const filteredByDate = decryptedData.filter((item) => {
      const createdAt = new Date(item.created_at)
      return createdAt >= startDate && createdAt <= endDate
    })

    const filtered = applyFilters(filteredByDate, filters)
    return paginateItems(filtered, options)
  } catch (error) {
    throw new Error(`Failed to get contact forms by date: ${(error as Error).message}`)
  }
}

export const getContactFormsByDateRange = async (
  dateRange: Record<string, string> = {},
  filters: Record<string, unknown> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const start = parseMmDdYyyyAsUtcRange(dateRange.startDate)
    const end = parseMmDdYyyyAsUtcRange(dateRange.endDate)

    const records = await listContactMessages()
    const documents = records.map(mapContactRecordToDocument)
    const decryptedData = cryptoService.decryptContacts(documents)

    const filteredByDate = decryptedData.filter((item) => {
      const createdAt = new Date(item.created_at)
      return createdAt >= start.startDate && createdAt <= end.endDate
    })

    const filtered = applyFilters(filteredByDate, filters)
    return paginateItems(filtered, options)
  } catch (error) {
    throw new Error(`Failed to get contact forms by date range: ${(error as Error).message}`)
  }
}

export const getContactFormsByStatus = async (
  statusFilter: Record<string, unknown> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const records = await listContactMessages()
    const documents = records.map(mapContactRecordToDocument)
    const decryptedData = cryptoService.decryptContacts(documents)
    const filtered = applyFilters(decryptedData, statusFilter)
    return paginateItems(filtered, options)
  } catch (error) {
    throw new Error(`Failed to get contact forms by status: ${(error as Error).message}`)
  }
}

export const updateContactFormStatus = async (
  id: string,
  status: 'new' | 'completed' | 'reviewing' | 'declined' | 'contacted' | 'spam' | 'closed'
): Promise<{ id: string; status: string; updated_at: string }> => {
  try {
    const existing = await getContactMessageById(id)
    const prevStatus = existing?.status

    const result = await updateContactMessage(id, { status })

    if (!result) {
      throw new Error('Contact form not found')
    }

    await syncNotificationCountOnStatusChange('messages', prevStatus, status)

    return {
      id: result.id,
      status: result.status,
      updated_at: result.updated_at.toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to update contact form status: ${(error as Error).message}`)
  }
}

export const updateContactFormTags = async (
  id: string,
  newTags: string[]
): Promise<{ id: string; tags: string[]; updated_at: string }> => {
  try {
    const existingContactForm = await getContactMessageById(id)

    if (!existingContactForm) {
      throw new Error('Contact form not found')
    }

    const updatedTags = [...new Set(newTags)]

    const result = await updateContactMessage(id, {
      tags: updatedTags
    })

    if (!result) {
      throw new Error('Contact form not found')
    }

    return {
      id: result.id,
      tags: result.tags,
      updated_at: result.updated_at.toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to add tags to contact form: ${(error as Error).message}`)
  }
}

export const deleteContactForm = async (id: string): Promise<void> => {
  try {
    const deleted = await deleteContactMessage(id)
    if (!deleted) {
      throw new Error('Contact form not found')
    }
  } catch (error) {
    throw new Error(`Failed to delete contact form: ${(error as Error).message}`)
  }
}

export const createContactFormPDFById = async (id: string): Promise<Buffer> => {
  try {
    const contactForm = await getContactFormById(id)
    return await ContactFormPDFGenerator.createSinglePDF(contactForm)
  } catch (error) {
    throw new Error(`Failed to create contact form PDF: ${(error as Error).message}`)
  }
}

export const createContactFormPDFBulk = async (ids: string[]): Promise<Buffer> => {
  try {
    const pdfFiles: PDFFile[] = []

    for (const id of ids) {
      const contactForm = await getContactFormById(id)
      const pdfBuffer = await ContactFormPDFGenerator.createSinglePDF(contactForm)
      const filename = `contact-form-${contactForm.first_name}-${contactForm.last_name}-${id.substring(0, 8)}.pdf`

      pdfFiles.push({
        buffer: pdfBuffer,
        filename
      })
    }

    if (pdfFiles.length === 0) {
      throw new Error('No valid contact forms found for the provided IDs')
    }

    return await Zippper.createPDFZip(pdfFiles)
  } catch (error) {
    throw new Error(`Failed to create bulk contact form PDFs: ${(error as Error).message}`)
  }
}