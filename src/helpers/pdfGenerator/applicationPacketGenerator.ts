import PDFDocument from 'pdfkit'
import path from 'node:path'
import { getStorage } from 'firebase-admin/storage'
import { PDFDocument as PDFLibDocument } from 'pdf-lib'

import type { ApplicationDocument, FileData } from '../../types/application'
import { getPositionLabel } from '../applicationPosition'

type PacketKind = 'general' | 'driver' | 'house'

type PacketOptions = {
  includeAppendices?: boolean
  includeResume?: boolean
  includeMVR?: boolean
  includeDriversLicense?: boolean
}

const APPENDIX_FILES = {
  background: 'background-check.pdf',
  availability: 'availability-schedule.pdf',
  caps: 'caps.pdf'
} as const

// Set APP_STATIC_BASE_URL in your .env — e.g. http://localhost:3000 or https://goldengatemanor.com
const APP_STATIC_BASE_URL = 'https://api.goldengatemanor.com'

async function loadAppendixPdf(name: keyof typeof APPENDIX_FILES): Promise<Buffer> {
  const url = `${APP_STATIC_BASE_URL}/static/application/${APPENDIX_FILES[name]}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch appendix "${name}": ${res.status} ${res.statusText} (${url})`)
  return Buffer.from(await res.arrayBuffer())
}

function extOf(filename: string) {
  return path.extname(filename || '').toLowerCase().replace('.', '')
}

function safeText(v: unknown) {
  return String(v ?? '').replace(/\s+/g, ' ').trim()
}

function yesNo(v: unknown) {
  const s = String(v ?? '').trim().toLowerCase()
  if (['y', 'yes', 'true', '1'].includes(s)) return 'Yes'
  if (['n', 'no', 'false', '0'].includes(s)) return 'No'
  return s ? s[0].toUpperCase() + s.slice(1) : ''
}

function formatSubmittedDate(createdAt?: string) {
  if (!createdAt) return ''
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function detectPacketKind(app: ApplicationDocument): PacketKind {
  const pos = safeText(app.position || app.personal?.select).toLowerCase()

  if (pos === 'ggmt-driver' || pos === 'city_cab-driver') return 'driver'
  if (pos === 'al_general' || pos === 'acf-qmap' || pos === 'acf-pcp') return 'house'

  return 'general'
}

function requiredAppendices(kind: PacketKind) {
  if (kind === 'house') return ['background', 'caps', 'availability'] as const
  if (kind === 'driver') return ['background', 'availability'] as const
  return ['background', 'availability'] as const
}

async function downloadFromFirebase(fileData: FileData): Promise<Buffer> {
  const bucket = getStorage().bucket()
  const file = bucket.file(fileData.filename)
  const [buf] = await file.download()
  return Buffer.from(buf)
}

async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  const out = await PDFLibDocument.create()

  for (const buf of buffers) {
    if (!buf?.length) continue
    const donor = await PDFLibDocument.load(buf)
    const pages = await out.copyPages(donor, donor.getPageIndices())
    for (const p of pages) out.addPage(p)
  }

  const bytes = await out.save()
  return Buffer.from(bytes)
}

function createPdfKitBuffer(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } })
      const chunks: Buffer[] = []
      doc.on('data', c => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      build(doc)
      doc.end()
    } catch (e) {
      reject(e)
    }
  })
}

async function createImagePagePdf(imageBuf: Buffer, label: string): Promise<Buffer> {
  return createPdfKitBuffer(doc => {
    doc.fontSize(16).fillColor('#2c3e50').font('Helvetica-Bold').text(label, { align: 'center' })
    doc.moveDown(1)

    const pageW = doc.page.width
    const pageH = doc.page.height
    const margin = 60
    const topY = doc.y + 10

    const boxW = pageW - margin * 2
    const boxH = pageH - topY - margin

    doc.image(imageBuf, margin, topY, { fit: [boxW, boxH], align: 'center', valign: 'center' })
  })
}

async function createPlaceholderPdf(label: string, filename: string): Promise<Buffer> {
  return createPdfKitBuffer(doc => {
    doc.fontSize(18).fillColor('#2c3e50').font('Helvetica-Bold').text(`${label} (Not merged)`, { align: 'left' })
    doc.moveDown(0.7)

    doc.fontSize(11).fillColor('#34495e').font('Helvetica')
      .text('This file was uploaded in a format that cannot be merged into the application packet.')
    doc.moveDown(0.4)
    doc.text('Please print it separately and attach it behind the packet.')
    doc.moveDown(1)

    doc.fontSize(10).fillColor('#7f8c8d').text(`File: ${filename}`)
    doc.text(`Type: .${extOf(filename) || 'unknown'}`)
  })
}

async function normalizeAttachmentToPdf(fileData: FileData, label: string): Promise<Buffer> {
  const buf = await downloadFromFirebase(fileData)
  const ext = extOf(fileData.filename)

  if (ext === 'pdf') return buf
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return await createImagePagePdf(buf, label)

  return await createPlaceholderPdf(label, fileData.filename)
}

export class ApplicationPacketPDFGenerator {
  static async createPacketPDF(app: ApplicationDocument, options: PacketOptions = {}): Promise<Buffer> {
    const kind = detectPacketKind(app)

    const includeAppendices = options.includeAppendices ?? true
    const includeResume = options.includeResume ?? true
    const includeMVR = options.includeMVR ?? true
    const includeDriversLicense = options.includeDriversLicense ?? true

    const summaryPdf = await ApplicationSummaryPDFGenerator.createSummaryPDF(app, kind)
    const buffers: Buffer[] = [summaryPdf]

    if (includeAppendices) {
      const forms = requiredAppendices(kind)
      for (const f of forms) buffers.push(await loadAppendixPdf(f))
    }

    if (includeResume && app.work?.resume?.filename) {
      buffers.push(await normalizeAttachmentToPdf(app.work.resume, 'Resume'))
    }

    if (includeMVR && app.driving?.MVR?.filename) {
      buffers.push(await normalizeAttachmentToPdf(app.driving.MVR, 'MVR'))
    }

    if (includeDriversLicense && app.driving?.driversLicense?.filename) {
      buffers.push(await normalizeAttachmentToPdf(app.driving.driversLicense, "Driver's License"))
    }

    return await mergePdfBuffers(buffers)
  }
}

class ApplicationSummaryPDFGenerator {
  static createSummaryPDF(app: ApplicationDocument, kind: PacketKind): Promise<Buffer> {
    return createPdfKitBuffer(doc => {
      this.addHeader(doc, app, kind)
      this.addDetails(doc, app, kind)
      this.addDigitalSignatureBlock(doc, app, kind)
      this.addFooter(doc, app)
    })
  }

  private static footerTopY(doc: PDFKit.PDFDocument) {
    return doc.page.height - 75
  }

  private static pageBottomLimit(doc: PDFKit.PDFDocument) {
    return this.footerTopY(doc) - 10
  }

  private static ensureSpace(doc: PDFKit.PDFDocument, app: ApplicationDocument, kind: PacketKind, neededHeight: number) {
    if (doc.y + neededHeight <= this.pageBottomLimit(doc)) return
    this.addFooter(doc, app)
    doc.addPage()
    this.addContinuationHeader(doc, app, kind)
  }

  private static addContinuationHeader(doc: PDFKit.PDFDocument, app: ApplicationDocument, kind: PacketKind) {
    const first = safeText(app.personal?.firstName || app.first_name)
    const last = safeText(app.personal?.lastName || app.last_name)
    const name = `${first} ${last}`.trim() || 'Applicant'
    const submittedDateOnly = formatSubmittedDate(app.created_at) || ''

    doc.fontSize(10).fillColor('#7f8c8d').font('Helvetica')
      .text('Employment Application Packet (continued)', 50, 50, { align: 'center' })

    doc.fontSize(9).fillColor('#7f8c8d')
      .text(`${name}${submittedDateOnly ? ` • Submitted ${submittedDateOnly}` : ''} • ${kind.toUpperCase()}`, 50, 66, { align: 'center' })

    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 84).lineTo(545, 84).stroke()
    doc.y = 105
  }

  private static addHeader(doc: PDFKit.PDFDocument, app: ApplicationDocument, kind: PacketKind) {
    const submittedDateOnly = formatSubmittedDate(app.created_at)

    const first = safeText(app.personal?.firstName || app.first_name)
    const last = safeText(app.personal?.lastName || app.last_name)
    const name = `${first} ${last}`.trim()

    const positionRaw = safeText(app.position || app.personal?.select)
    const positionLabel = getPositionLabel(positionRaw) || positionRaw

    doc.fontSize(26).fillColor('#2c3e50').font('Helvetica')
      .text('Employment Application Packet', 50, 50, { align: 'center' })

    doc.fontSize(12).fillColor('#2c3e50')
      .text(`Applicant: ${name || 'Applicant'}`, 50, 92, { align: 'center' })

    doc.fontSize(11).fillColor('#2c3e50')
      .text(`Position: ${positionLabel}`, 50, 114, { align: 'center' })

    if (submittedDateOnly) {
      doc.fontSize(10).fillColor('#7f8c8d')
        .text(`Submitted: ${submittedDateOnly}`, 50, 136, { align: 'center' })
    }

    doc.fontSize(9).fillColor('#7f8c8d')
      .text(`Application ID: ${app.id}`, 50, 154, { align: 'center' })

    doc.fontSize(10).fillColor('#7f8c8d')
      .text(`Packet Type: ${kind.toUpperCase()}`, 50, 172, { align: 'center' })

    doc.strokeColor('#bdc3c7').lineWidth(1).moveTo(50, 196).lineTo(545, 196).stroke()
    doc.y = 218
  }

  private static addSectionTitle(doc: PDFKit.PDFDocument, app: ApplicationDocument, kind: PacketKind, title: string) {
    this.ensureSpace(doc, app, kind, 46)

    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const left = doc.page.margins.left

    doc.moveDown(0.4)
    doc.fontSize(16).fillColor('#2c3e50').font('Helvetica-Bold')
      .text(title, left, doc.y, { width, align: 'center' })

    const y = doc.y + 18
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(left, y).lineTo(left + width, y).stroke()
    doc.y = y + 14

    doc.fontSize(11).fillColor('#34495e').font('Helvetica')
  }

  private static measureLabelWidth(doc: PDFKit.PDFDocument, label: string) {
    doc.save()
    doc.font('Helvetica-Bold').fontSize(11)
    const w = doc.widthOfString(label)
    doc.restore()
    return Math.min(180, Math.max(70, w + 4))
  }

  private static addFormRow(
    doc: PDFKit.PDFDocument,
    app: ApplicationDocument,
    kind: PacketKind,
    label: string,
    value: string,
    opts?: { underline?: boolean; minHeight?: number }
  ) {
    const left = doc.page.margins.left
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right

    const labelW = this.measureLabelWidth(doc, label)
    const gap = 8
    const valueX = left + labelW + gap
    const valueW = width - labelW - gap

    doc.save()
    doc.font('Helvetica-Bold').fontSize(11)
    const labelH = doc.heightOfString(label, { width: labelW })
    doc.restore()

    doc.save()
    doc.font('Helvetica').fontSize(11)
    const valueH = doc.heightOfString(value || '', { width: valueW })
    const lineH = doc.currentLineHeight()
    doc.restore()

    const contentH = Math.max(labelH, valueH, lineH)
    const rowH = Math.max(opts?.minHeight ?? 18, contentH) + 10

    this.ensureSpace(doc, app, kind, rowH)

    const y = doc.y

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#2c3e50').text(label, left, y, { width: labelW })
    doc.font('Helvetica').fontSize(11).fillColor('#111827').text(value || '', valueX, y, { width: valueW })

    if (opts?.underline !== false) {
      doc.save()
      doc.font('Helvetica').fontSize(11)
      const singleLineH = doc.currentLineHeight()
      doc.restore()
      const underlineH = Math.max(valueH, singleLineH)
      const lineY = y + underlineH + 1
      doc.strokeColor('#9ca3af').lineWidth(0.75).moveTo(valueX, lineY).lineTo(valueX + valueW, lineY).stroke()
    }

    doc.y = y + rowH
  }

  private static addTwoColumnRow(
    doc: PDFKit.PDFDocument,
    app: ApplicationDocument,
    kind: PacketKind,
    leftField: { label: string; value: string },
    rightField: { label: string; value: string }
  ) {
    const left = doc.page.margins.left
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right

    const gap = 24
    const colW = (width - gap) / 2
    const y = doc.y

    const leftLabelW = this.measureLabelWidth(doc, leftField.label)
    const rightLabelW = this.measureLabelWidth(doc, rightField.label)
    const pad = 6

    const leftValueX = left + leftLabelW + pad
    const leftValueW = colW - leftLabelW - pad

    const rightX = left + colW + gap
    const rightValueX = rightX + rightLabelW + pad
    const rightValueW = colW - rightLabelW - pad

    doc.save()
    doc.font('Helvetica').fontSize(11)
    const lineH = doc.currentLineHeight()
    const leftValueH = doc.heightOfString(leftField.value || '', { width: leftValueW })
    const rightValueH = doc.heightOfString(rightField.value || '', { width: rightValueW })
    doc.restore()

    const contentH = Math.max(lineH, leftValueH, rightValueH)
    const rowH = contentH + 12

    this.ensureSpace(doc, app, kind, rowH)

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#2c3e50').text(leftField.label, left, y, { width: leftLabelW })
    doc.font('Helvetica').fontSize(11).fillColor('#111827').text(leftField.value || '', leftValueX, y, { width: leftValueW })

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#2c3e50').text(rightField.label, rightX, y, { width: rightLabelW })
    doc.font('Helvetica').fontSize(11).fillColor('#111827').text(rightField.value || '', rightValueX, y, { width: rightValueW })

    doc.save()
    doc.font('Helvetica').fontSize(11)
    const singleLineH = doc.currentLineHeight()
    doc.restore()
    const underlineH = Math.max(contentH, singleLineH)
    const lineY = y + underlineH + 1
    doc.strokeColor('#9ca3af').lineWidth(0.75).moveTo(leftValueX, lineY).lineTo(left + colW, lineY).stroke()
    doc.strokeColor('#9ca3af').lineWidth(0.75).moveTo(rightValueX, lineY).lineTo(rightX + colW, lineY).stroke()

    doc.y = y + rowH
  }

  private static addDetails(doc: PDFKit.PDFDocument, app: ApplicationDocument, kind: PacketKind) {
    const p = app.personal
    const w = app.work
    const d = app.driving

    const first = safeText(p?.firstName || app.first_name)
    const last = safeText(p?.lastName || app.last_name)
    const fullName = `${first} ${last}`.trim()
    const submittedDateOnly = formatSubmittedDate(app.created_at)

    this.addSectionTitle(doc, app, kind, 'Personal Information')

    this.addTwoColumnRow(
      doc,
      app,
      kind,
      { label: 'Name:', value: fullName },
      { label: 'Date:', value: submittedDateOnly }
    )

    this.addFormRow(doc, app, kind, 'Phone:', safeText(p?.phoneNumber || app.phone), { underline: true })
    this.addFormRow(doc, app, kind, 'Address:', safeText(p?.address), { underline: true, minHeight: 22 })

    this.addFormRow(doc, app, kind, 'Over 18:', yesNo(p?.over18), { underline: false })
    this.addFormRow(doc, app, kind, 'Authorized to Work:', yesNo(p?.citizen), { underline: false })
    this.addFormRow(doc, app, kind, 'Felony Charged:', yesNo(p?.felony), { underline: false })

    this.addSectionTitle(doc, app, kind, 'Work Information')

    this.addFormRow(doc, app, kind, 'Learned about us:', safeText(w?.learnedAboutUs), { underline: true })
    if (safeText(w?.otherExplain)) this.addFormRow(doc, app, kind, 'Other (details):', safeText(w?.otherExplain), { underline: false, minHeight: 22 })

    this.addFormRow(doc, app, kind, 'Worked here before:', yesNo(w?.hasWorkedAtGoldenGate), { underline: false })
    this.addFormRow(doc, app, kind, 'Employment type:', safeText(w?.employmentType), { underline: true })
    if (safeText(w?.availability)) this.addFormRow(doc, app, kind, 'Availability:', safeText(w?.availability), { underline: false, minHeight: 22 })

    this.addFormRow(doc, app, kind, 'Willing overtime:', yesNo(w?.willingToWorkOvertime), { underline: false })
    this.addFormRow(doc, app, kind, 'Preferred pay:', safeText(w?.preferablePayRate), { underline: true })
    this.addFormRow(doc, app, kind, 'Start date:', safeText(w?.dateAvailableToStart), { underline: true })

    const showDriving = kind === 'driver' || Boolean(
      d?.MVR?.filename ||
      d?.driversLicense?.filename ||
      safeText(d?.endorsements) ||
      safeText(d?.accidents) ||
      safeText(d?.trafficConvictions)
    )

    if (showDriving) {
      this.addFooter(doc, app)
      doc.addPage()
      this.addContinuationHeader(doc, app, kind)
      this.addSectionTitle(doc, app, kind, 'Driving Information')

      this.addFormRow(doc, app, kind, 'Has endorsements:', yesNo(d?.hasEndorsements), { underline: false })
      if (safeText(d?.endorsements)) this.addFormRow(doc, app, kind, 'Endorsements:', safeText(d?.endorsements), { underline: false, minHeight: 22 })

      this.addFormRow(doc, app, kind, 'Accidents:', yesNo(d?.hasAccidents), { underline: false })
      if (safeText(d?.accidents)) this.addFormRow(doc, app, kind, 'Accident notes:', safeText(d?.accidents), { underline: false, minHeight: 22 })

      this.addFormRow(doc, app, kind, 'Traffic convictions:', yesNo(d?.hasTrafficConvictions), { underline: false })
      if (safeText(d?.trafficConvictions)) this.addFormRow(doc, app, kind, 'Conviction notes:', safeText(d?.trafficConvictions), { underline: false, minHeight: 22 })

      this.addFormRow(doc, app, kind, 'MVR provided:', yesNo(d?.hasMVR), { underline: false })
    }

    this.addFooter(doc, app)
    doc.addPage()
    this.addContinuationHeader(doc, app, kind)
    this.addSectionTitle(doc, app, kind, 'Attachments Checklist')

    const resumeExt = w?.resume?.filename ? extOf(w.resume.filename) : ''
    const mvrExt = d?.MVR?.filename ? extOf(d.MVR.filename) : ''
    const dlExt = d?.driversLicense?.filename ? extOf(d.driversLicense.filename) : ''

    const okExt = (e: string) => ['pdf', 'png', 'jpg', 'jpeg'].includes(e)

    const resumeLine = `${w?.resume?.filename ? (okExt(resumeExt) ? '[x]' : '[ ]') : '[ ]'} Resume (PDF/image)`
    const mvrLine = `${d?.MVR?.filename ? (okExt(mvrExt) ? '[x]' : '[ ]') : '[ ]'} MVR (PDF/image)`
    const dlLine = `${d?.driversLicense?.filename ? (okExt(dlExt) ? '[x]' : '[ ]') : '[ ]'} Driver's License (PDF/image)`

    this.ensureSpace(doc, app, kind, 54)
    doc.fontSize(11).fillColor('#111827').font('Helvetica')
    doc.text(resumeLine, { align: 'left' })
    doc.text(mvrLine, { align: 'left' })
    doc.text(dlLine, { align: 'left' })

    doc.moveDown(0.3)
    doc.fontSize(9).fillColor('#7f8c8d').font('Helvetica')
      .text('If a file is not PDF/image, a placeholder page will be included telling staff to print it separately.')
    doc.moveDown(0.8)
  }

  private static addDigitalSignatureBlock(doc: PDFKit.PDFDocument, app: ApplicationDocument, kind: PacketKind) {
    const first = safeText(app.personal?.firstName || app.first_name)
    const last = safeText(app.personal?.lastName || app.last_name)
    const fullName = `${first} ${last}`.trim() || 'Applicant'
    const signedDate = formatSubmittedDate(app.created_at)

    this.addSectionTitle(doc, app, kind, 'Digital Signature / Attestation')

    const left = doc.page.margins.left
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const attestation = 'The applicant submitted this application online and digitally signed/attested that the information provided was true and correct and agreed to the online attestation presented on the website.'

    doc.save()
    doc.font('Helvetica').fontSize(9.5)
    const attH = doc.heightOfString(attestation, { width })
    doc.restore()

    this.ensureSpace(doc, app, kind, attH + 55)

    doc.font('Helvetica').fontSize(9.5).fillColor('#111827')
      .text(attestation, left, doc.y, { width, align: 'left' })

    doc.moveDown(0.8)

    const label = 'Signature:'
    const labelW = this.measureLabelWidth(doc, label)
    const gap = 8
    const valueX = left + labelW + gap
    const valueW = width - labelW - gap
    const y = doc.y

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#2c3e50').text(label, left, y, { width: labelW })
    doc.font('Helvetica').fontSize(11).fillColor('#111827').text(fullName, valueX, y, { width: valueW })

    const contentH = doc.currentLineHeight()
    const lineY = y + contentH + 3
    doc.strokeColor('#9ca3af').lineWidth(0.75).moveTo(valueX, lineY).lineTo(valueX + valueW, lineY).stroke()

    doc.font('Helvetica').fontSize(9).fillColor('#9ca3af')
      .text(`Digitally signed on ${signedDate}`, valueX, lineY + 6, { width: valueW, align: 'left' })

    doc.y = lineY + 22
  }

  private static addFooter(doc: PDFKit.PDFDocument, app: ApplicationDocument) {
    doc.strokeColor('#bdc3c7').lineWidth(1).moveTo(50, doc.page.height - 75).lineTo(545, doc.page.height - 75).stroke()

    const footerY = doc.page.height - 60

    const first = safeText(app.personal?.firstName || app.first_name)
    const last = safeText(app.personal?.lastName || app.last_name)
    const leftText = `${last}${last && first ? ', ' : ''}${first}`.trim() || 'Applicant'

    const leftX = 50
    const leftW = 150
    const rightW = 160
    const totalW = doc.page.width - leftX * 2
    const centerW = totalW - leftW - rightW
    const centerX = leftX + leftW
    const rightX = leftX + totalW - rightW

    doc.fontSize(8).fillColor('#7f8c8d').font('Helvetica')
      .text(leftText, leftX, footerY, { width: leftW, align: 'left' })

    doc.fontSize(8).fillColor('#7f8c8d').font('Helvetica')
      .text('Reviewed By: ____________________', centerX, footerY, { width: centerW, align: 'center' })

    doc.fontSize(8).fillColor('#7f8c8d').font('Helvetica')
      .text('Application Packet Summary', rightX, footerY, { width: rightW, align: 'right' })
  }
}