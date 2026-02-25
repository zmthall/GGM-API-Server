// controllers/application.controller.ts
import type { Request, Response, RequestHandler, NextFunction } from 'express'
import contentDisposition from 'content-disposition'
import type { FileUpload } from '../types/application'
import * as applicationService from '../services/application.services'

function parseApplicationData(req: Request) {
  const raw = (req.body as any)?.applicationData ?? req.body
  if (typeof raw === 'string') return JSON.parse(raw)
  return raw
}

/** Express query helpers */
function qString(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return undefined
}

function qInt(v: unknown, fallback: number): number {
  const s = qString(v)
  const n = s ? parseInt(s, 10) : NaN
  return Number.isFinite(n) ? n : fallback
}

function qBool(v: unknown, fallback: boolean): boolean {
  const s = qString(v)
  if (!s) return fallback
  const t = s.trim().toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(t)) return true
  if (['false', '0', 'no', 'n'].includes(t)) return false
  return fallback
}

const safe = (s: string) =>
  (s ?? '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\r\n\s]/g, '_')
    .trim()
    .slice(0, 120)

function parseIdsFromRequest(req: Request): string[] {
  // Supports:
  // - GET /export/pdf/bulk?ids=a,b,c
  // - OR body { ids: [...] } (in case client sends it)
  const fromBody = (req.body as any)?.ids
  if (Array.isArray(fromBody)) return fromBody.map(String).filter(Boolean)

  const idsQuery = qString((req.query as any)?.ids)
  if (idsQuery) return idsQuery.split(',').map(s => s.trim()).filter(Boolean)

  return []
}

export const submitApplication: RequestHandler = async (req: Request, res: Response) => {
  try {
    const applicationData = parseApplicationData(req)
    const files: FileUpload[] = (req.files as FileUpload[]) || []

    if (!applicationData?.personal || !applicationData?.work) {
      res.status(400).json({ success: false, message: 'Invalid application payload' })
      return
    }

    const result = await applicationService.submitApplication(applicationData, files)

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: result.documentId
    })
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
    return
  }
}

export const getAllApplications: RequestHandler = async (req: Request, res: Response) => {
  try {
    const page = qInt(req.query.page, 1)
    const pageSize = qInt(req.query.pageSize ?? req.query.limit, 10)

    // Your composable sends omit=true/false
    const omit = qBool(req.query.omit, true)

    const filters: Record<string, unknown> = {}

    const status = qString(req.query.status)
    const position = qString(req.query.position)
    const department = qString(req.query.department)
    const position_name = qString(req.query.position_name)

    if (status) filters.status = status
    if (position) filters.position = position
    if (department) filters.department = department
    if (position_name) filters.position_name = position_name

    const result = await applicationService.getAllApplications(filters, omit, { page, pageSize })

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
    return
  }
}

export const getApplicationById: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ success: false, message: 'Application ID is required' })
      return
    }

    const application = await applicationService.getApplicationById(id)

    res.status(200).json({ success: true, data: application })
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
    return
  }
}

export const updateApplicationStatus: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body as any

    if (!id) {
      res.status(400).json({ success: false, message: 'Application ID is required' })
      return
    }

    const result = await applicationService.updateApplicationStatus(id, status)

    res.status(200).json({
      success: true,
      data: result
    })
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
    return
  }
}

export const updateApplicationTags: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { tags } = req.body as any

    if (!id) {
      res.status(400).json({ success: false, message: 'Application ID is required' })
      return
    }

    if (!Array.isArray(tags)) {
      res.status(400).json({ success: false, message: 'tags must be an array' })
      return
    }

    const result = await applicationService.updateApplicationTags(id, tags)

    res.status(200).json({
      success: true,
      data: result
    })
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
    return
  }
}

export const deleteApplication: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ success: false, message: 'Application ID is required' })
      return
    }

    await applicationService.deleteApplication(id)

    res.status(200).json({ success: true })
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
    return
  }
}

// ✅ GET /export/pdf/:id
export const createApplicationPacketPDFById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const log = (req as any).log?.child?.({ route: 'application.exportPDF', applicationId: id }) ?? console

  if (!id) {
    ;(log as any).warn?.('missing-id')
    res.status(400).json({ success: false, message: 'Missing route param: id' })
    return
  }

  try {
    const pdfBuffer = await applicationService.createApplicationPacketPDFById(id)

    const appDoc = await applicationService.getApplicationById(id)
    const first = appDoc?.personal?.firstName || appDoc?.first_name || ''
    const last = appDoc?.personal?.lastName || appDoc?.last_name || ''
    const base = safe(`application-${`${first} ${last}`.trim() || 'applicant'}`)
    const filename = `${base}-${id.slice(0, 8)}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', contentDisposition(filename))
    res.setHeader('X-Filename', encodeURIComponent(filename))
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Filename')
    res.setHeader('Content-Length', String(pdfBuffer.length))

    res.on('close', () => {
      if (!res.writableEnded) {
        ;(log as any).warn?.({ statusCode: res.statusCode }, 'download-aborted')
      }
    })

    res.end(pdfBuffer)
    ;(log as any).info?.({ filename, pdfBytes: pdfBuffer.length }, 'success')
  } catch (err) {
    ;(log as any).error?.({ err }, 'export-pdf-error')
    next(err)
    return
  }
}

// ✅ GET /export/pdf/bulk?ids=a,b,c  (or body.ids)
export const createApplicationPacketPDFBulk: RequestHandler = async (req: Request, res: Response) => {
  try {
    const ids = parseIdsFromRequest(req)

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ids are required. Use ?ids=id1,id2 or { ids: [...] }'
      })
      return
    }

    const zipBuffer = await applicationService.createApplicationPacketPDFBulk(ids)

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `applications-bulk-${timestamp}.zip`

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(zipBuffer)
    return
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
    return
  }
}