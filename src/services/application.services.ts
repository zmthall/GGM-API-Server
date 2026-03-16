import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { getStorage } from 'firebase-admin/storage'

import type { ApplicationData, ApplicationDocument, ApplicationRequestStatus, FileData, FileUpload } from '../types/application'
import type { PaginatedResult, PaginationOptions } from '../types/pagination'

import { cryptoService } from './crypto.services'
import {
  createJobApplication,
  deleteJobApplication,
  getJobApplicationById,
  listJobApplications,
  updateJobApplication
} from '../helpers/database/jobApplications/jobApplications.db'

import { ApplicationPacketPDFGenerator } from '../helpers/pdfGenerator/applicationPacketGenerator'
import { Zippper } from '../helpers/fileZip'
import { increaseNotificationCount, syncNotificationCountOnDelete, syncNotificationCountOnStatusChange } from './notification.services'
import { NOTIFICATION_TYPE_BY_COLLECTION } from '../config/notification'
import { safe, toSafeCorrespondenceStatus, toSafeRecord } from '../helpers/safe'

type PDFFile = { buffer: Buffer; filename: string }

const COLLECTION = 'job_applications'

function splitPosition(v: string) {
  const raw = (v ?? '').trim()
  if (raw.includes('-')) {
    const [department, ...rest] = raw.split('-')
    return { department, position_name: rest.join('-') }
  }
  return { department: raw, position_name: '' }
}

function normalizeStatus(input: unknown): ApplicationRequestStatus | null {
  if (typeof input !== 'string') return null
  const v = input.trim().toLowerCase()
  if (v === 'do not hire') return 'do_not_hire'
  const valid: ApplicationRequestStatus[] = ['new', 'reviewing', 'interviewed', 'do_not_hire', 'spam', 'closed']
  return valid.includes(v as ApplicationRequestStatus) ? (v as ApplicationRequestStatus) : null
}

function buildFirebaseDownloadUrl(bucketName: string, objectPath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`
}

async function uploadFileToFirebase(file: FileUpload, docId: string): Promise<FileData> {
  const bucket = getStorage().bucket()
  const bucketName = bucket.name

  const ext = path.extname(file.originalname || '').toLowerCase()
  const base = safe(path.basename(file.originalname || 'file', ext))
  const objectName = `${file.fieldname}-${Date.now()}-${randomUUID()}-${base}${ext || ''}`
  const objectPath = `job-applications/${docId}/${objectName}`

  const token = randomUUID()
  const blob = bucket.file(objectPath)

  await blob.save(file.buffer, {
    resumable: false,
    contentType: file.mimetype,
    metadata: { metadata: { firebaseStorageDownloadTokens: token } }
  })

  return { filename: objectPath, url: buildFirebaseDownloadUrl(bucketName, objectPath, token) }
}

function mergeUploadedFiles(app: ApplicationData, uploaded: Record<string, FileData>): ApplicationData {
  const merged: ApplicationData = structuredClone(app)

  if (uploaded.resume) merged.work.resume = uploaded.resume
  if (uploaded.MVR) merged.driving.MVR = uploaded.MVR
  if (uploaded.driversLicense) merged.driving.driversLicense = uploaded.driversLicense
  if (!merged.driving.driversLicense && uploaded.dl) merged.driving.driversLicense = uploaded.dl

  return merged
}

function mapRecordToApplicationDocument(
  record: Awaited<ReturnType<typeof getJobApplicationById>> extends infer T
    ? T extends null
      ? never
      : T
    : never
): ApplicationDocument {
  const personal = record.personal_payload as unknown as ApplicationDocument['personal']
  const driving = record.driving_payload as unknown as ApplicationDocument['driving']
  const work = record.work_payload as unknown as ApplicationDocument['work']

  return {
    id: record.id,
    contact_type: record.contact_type,
    created_at: record.created_at.toISOString(),
    department: record.department,
    position: record.position,
    position_name: record.position_name,
    status: record.status as ApplicationRequestStatus,
    tags: record.tags,
    updated_at: record.updated_at.toISOString(),

    personal,
    driving,
    work,

    first_name: personal.firstName,
    last_name: personal.lastName,
    phone: personal.phoneNumber
  } as unknown as ApplicationDocument
}

function applyFilters(
  items: ApplicationDocument[],
  filters: Record<string, unknown> = {}
): ApplicationDocument[] {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true
      return (item as unknown as Record<string, unknown>)[key] === value
    })
  })
}

function applyOmitSpam(items: ApplicationDocument[], omit: boolean): ApplicationDocument[] {
  if (!omit) return items
  return items.filter((item) => item.status !== 'spam')
}

function paginateItems<T>(items: T[], options: PaginationOptions = {}): PaginatedResult<T> {
  const currentPage = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.max(1, Number(options.pageSize) || 10)
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

export const submitApplication = async (applicationData: ApplicationData, files: FileUpload[]) => {
  const position = String(applicationData?.personal?.select ?? '').trim()
  const { department, position_name } = splitPosition(position)

  const hasResumeUpload = (files || []).some(f => f?.fieldname === 'resume')
  if (!hasResumeUpload) throw new Error('Missing required file: resume')

  const encryptedData = cryptoService.encryptApplication(applicationData)

  const created = await createJobApplication({
    id: randomUUID(),
    contactType: 'Job Application',
    createdAt: new Date(),
    department,
    position,
    positionName: position_name,
    status: 'new',
    tags: [],
    personalPayload: toSafeRecord(encryptedData.personal),
    drivingPayload: toSafeRecord(encryptedData.driving),
    workPayload: toSafeRecord(encryptedData.work),
    rawPayload: {}
  })

  if (created.id) {
    await increaseNotificationCount(NOTIFICATION_TYPE_BY_COLLECTION[COLLECTION])
  }

  const documentId = created.id

  const uploaded: Record<string, FileData> = {}
  for (const f of files || []) {
    if (!f?.buffer?.length) continue
    uploaded[f.fieldname] = await uploadFileToFirebase(f, documentId)
  }

  if (Object.keys(uploaded).length > 0) {
    const merged = mergeUploadedFiles(applicationData, uploaded)
    const encryptedMerged = cryptoService.encryptApplication(merged)

    await updateJobApplication(documentId, {
      personalPayload: toSafeRecord(encryptedMerged.personal),
      drivingPayload: toSafeRecord(encryptedMerged.driving),
      workPayload: toSafeRecord(encryptedMerged.work)
    })
  }

  return { success: true, documentId }
}

export const getAllApplications = async (
  filters: Record<string, unknown> = {},
  omit: boolean = true,
  options: PaginationOptions = {}
): Promise<PaginatedResult<ApplicationDocument>> => {
  const records = await listJobApplications()
  const docs = records.map(mapRecordToApplicationDocument)
  const filtered = applyOmitSpam(applyFilters(docs, filters), omit)
  const paginated = paginateItems(filtered, options)

  return {
    data: cryptoService.decryptApplications(paginated.data),
    pagination: paginated.pagination
  }
}

export const getApplicationById = async (id: string): Promise<ApplicationDocument> => {
  const record = await getJobApplicationById(id)
  if (!record) throw new Error('Application not found')
  return cryptoService.decryptApplication(mapRecordToApplicationDocument(record))
}

export const updateApplicationStatus = async (
  id: string,
  statusInput: unknown
): Promise<{ id: string; status: ApplicationRequestStatus; updated_at: string }> => {
  const existing = await getJobApplicationById(id)
  const prevStatus = existing?.status

  const status = normalizeStatus(statusInput)
  if (!status) throw new Error('Invalid status')

  const result = await updateJobApplication(id, { status })
  if (!result) throw new Error('Application not found')

  await syncNotificationCountOnStatusChange('applications', toSafeCorrespondenceStatus(prevStatus), status)

  return {
    id: result.id,
    status: result.status as ApplicationRequestStatus,
    updated_at: result.updated_at.toISOString()
  }
}

export const updateApplicationTags = async (
  id: string,
  tags: string[]
): Promise<{ id: string; tags: string[]; updated_at: string }> => {
  const uniq = [...new Set((tags || []).map(t => String(t).trim()).filter(Boolean))]
  const result = await updateJobApplication(id, { tags: uniq })
  if (!result) throw new Error('Application not found')

  return {
    id: result.id,
    tags: result.tags,
    updated_at: result.updated_at.toISOString()
  }
}

export const deleteApplication = async (id: string): Promise<void> => {
  const existing = await getJobApplicationById(id);
  const currentStatus = toSafeCorrespondenceStatus(existing?.status);;

  const deleted = await deleteJobApplication(id)
  if (!deleted) throw new Error('Application not found')
    
  await syncNotificationCountOnDelete('applications', currentStatus)
}

export const createApplicationPacketPDFById = async (id: string): Promise<Buffer> => {
  try {
    const application = await getApplicationById(id)
    return await ApplicationPacketPDFGenerator.createPacketPDF(application)
  } catch (error) {
    throw new Error(`Failed to create application packet PDF: ${(error as Error).message}`)
  }
}

export const createApplicationPacketPDFBulk = async (ids: string[]): Promise<Buffer> => {
  try {
    const pdfFiles: PDFFile[] = []

    for (const id of ids) {
      let application: ApplicationDocument | null = null
      try {
        application = await getApplicationById(id)
      } catch {
        application = null
      }

      if (!application) {
        console.warn(`Application with ID ${id} not found, skipping...`)
        continue
      }

      const pdfBuffer = await ApplicationPacketPDFGenerator.createPacketPDF(application)

      const first = application.personal?.firstName || ''
      const last = application.personal?.lastName || ''
      const fullName = `${first} ${last}`.trim() || 'applicant'
      const filename = `application-${fullName.replaceAll(/\s+/g, '-').toLowerCase()}-${id.substring(0, 8)}.pdf`

      pdfFiles.push({ buffer: pdfBuffer, filename })
    }

    if (pdfFiles.length === 0) {
      throw new Error('No valid applications found for the provided IDs')
    }

    return await Zippper.createPDFZip(pdfFiles)
  } catch (error) {
    throw new Error(`Failed to create bulk application packet PDFs: ${(error as Error).message}`)
  }
}