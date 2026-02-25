import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { getStorage } from 'firebase-admin/storage'

import type { ApplicationData, ApplicationDocument, ApplicationRequestStatus, FileData, FileUpload } from '../types/application'
import type { PaginatedResult, PaginationOptions } from '../types/pagination'

import { cryptoService } from './crypto.services'
import { deleteDocument, getDocument, getPaginatedDocuments, saveApplicationData, updateDocument } from '../helpers/firebase'

// ✅ PDF packet generator
import { ApplicationPacketPDFGenerator } from '../helpers/pdfGenerator/applicationPacketGenerator'
import { Zippper } from '../helpers/fileZip'

type PDFFile = { buffer: Buffer; filename: string }

const COLLECTION = 'job_applications'

const safe = (s: string) =>
  (s ?? '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\r\n\s]/g, '_')
    .trim()
    .slice(0, 120)

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

export const submitApplication = async (applicationData: ApplicationData, files: FileUpload[]) => {
  const position = String(applicationData?.personal?.select ?? '').trim()
  const { department, position_name } = splitPosition(position)

  const hasResumeUpload = (files || []).some(f => f?.fieldname === 'resume')
  if (!hasResumeUpload) throw new Error('Missing required file: resume')

  // Step 1: encrypt
  const encryptedData = cryptoService.encryptApplication(applicationData)

  // Step 2: save encrypted + store queryable meta fields
  const saved = await saveApplicationData(encryptedData, COLLECTION, {
    status: 'new',
    position,
    additionalFields: { department, position_name }
  })

  if (!saved?.id) throw new Error('Failed to save application (no document id returned)')

  const documentId = saved.id

  // Upload files, then merge + re-encrypt and update
  const uploaded: Record<string, FileData> = {}
  for (const f of files || []) {
    if (!f?.buffer?.length) continue
    uploaded[f.fieldname] = await uploadFileToFirebase(f, documentId)
  }

  if (Object.keys(uploaded).length > 0) {
    const merged = mergeUploadedFiles(applicationData, uploaded)
    const encryptedMerged = cryptoService.encryptApplication(merged)

    await updateDocument(COLLECTION, documentId, {
      ...encryptedMerged,
      updated_at: new Date().toISOString()
    })
  }

  return { success: true, documentId }
}

export const getAllApplications = async (
  filters: Record<string, unknown> = {},
  omit: boolean = true,
  options: PaginationOptions = {}
): Promise<PaginatedResult<ApplicationDocument>> => {
  const page = options.page || 1
  const pageSize = options.pageSize || 10

  const omitValue = omit ? { status: 'spam' } : {}

  const result = await getPaginatedDocuments<ApplicationDocument>(
    COLLECTION,
    filters,
    omitValue,
    { page, pageSize, orderField: 'created_at', orderDirection: 'desc' }
  )

  return {
    data: cryptoService.decryptApplications(result.data),
    pagination: result.pagination
  }
}

export const getApplicationById = async (id: string): Promise<ApplicationDocument> => {
  const doc = await getDocument<ApplicationDocument>(COLLECTION, id)
  if (!doc) throw new Error('Application not found')
  return cryptoService.decryptApplication(doc)
}

export const updateApplicationStatus = async (
  id: string,
  statusInput: unknown
): Promise<{ id: string; status: ApplicationRequestStatus; updated_at: string }> => {
  const status = normalizeStatus(statusInput)
  if (!status) throw new Error('Invalid status')

  const updated_at = new Date().toISOString()
  const result = await updateDocument(COLLECTION, id, { status, updated_at })
  return result as { id: string; status: ApplicationRequestStatus; updated_at: string }
}

export const updateApplicationTags = async (
  id: string,
  tags: string[]
): Promise<{ id: string; tags: string[]; updated_at: string }> => {
  const updated_at = new Date().toISOString()
  const uniq = [...new Set((tags || []).map(t => String(t).trim()).filter(Boolean))]
  const result = await updateDocument(COLLECTION, id, { tags: uniq, updated_at })
  return result as { id: string; tags: string[]; updated_at: string }
}

export const deleteApplication = async (id: string): Promise<void> => {
  await deleteDocument(COLLECTION, id)
}

// ✅ PDF: single
export const createApplicationPacketPDFById = async (id: string): Promise<Buffer> => {
  try {
    const application = await getApplicationById(id)

    if (!application) {
      throw new Error('Application not found')
    }

    const pdfBuffer = await ApplicationPacketPDFGenerator.createPacketPDF(application)
    return pdfBuffer
  } catch (error) {
    throw new Error(`Failed to create application packet PDF: ${(error as Error).message}`)
  }
}

// ✅ PDF: bulk zip
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

      const first = application.personal?.firstName || application.first_name || ''
      const last = application.personal?.lastName || application.last_name || ''
      const fullName = `${first} ${last}`.trim() || 'applicant'
      const filename = `application-${fullName.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 8)}.pdf`

      pdfFiles.push({ buffer: pdfBuffer, filename })
    }

    if (pdfFiles.length === 0) {
      throw new Error('No valid applications found for the provided IDs')
    }

    const zipBuffer = await Zippper.createPDFZip(pdfFiles)
    return zipBuffer
  } catch (error) {
    throw new Error(`Failed to create bulk application packet PDFs: ${(error as Error).message}`)
  }
}