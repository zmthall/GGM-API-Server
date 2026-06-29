import PDFDocument from 'pdfkit'
import {
  ConsultationMessageRecord,
  ConsultationFormStatus
} from '../../types/consultationForm'

export class ConsultationRequestPDFGenerator {
  static addedReviewedLine = false

  static createSinglePDF(
    consultationRequest: ConsultationMessageRecord
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        })

        const chunks: Buffer[] = []

        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        this.addHeader(doc, consultationRequest)
        this.addConsultationDetails(doc, consultationRequest)
        this.addCareAssessmentSection(doc, consultationRequest)

        if (consultationRequest.message) {
          this.addMessageSection(doc, consultationRequest)
        }

        this.addFooter(doc, consultationRequest)

        doc.end()
        this.addedReviewedLine = false
      } catch (error) {
        reject(error)
      }
    })
  }

  private static addHeader(
    doc: PDFKit.PDFDocument,
    consultationRequest: ConsultationMessageRecord
  ): void {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const dateObj = new Date(consultationRequest.created_at)
    const datePart = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const timePart = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    const sentDate = `${datePart} at ${timePart}`
    const fullName = `${consultationRequest.first_name} ${consultationRequest.last_name}`.trim()

    doc
      .fontSize(24)
      .fillColor('#2c3e50')
      .text(`Consultation Request From: ${fullName}`, 50, 50, {
        align: 'center',
      })

    doc
      .fontSize(14)
      .fillColor('#2c3e50')
      .text(`Submitted on: ${sentDate}`, 50, 85, {
        align: 'center',
      })

    const statusColor = this.getStatusColor(consultationRequest.status)

    doc
      .fontSize(14)
      .fillColor(statusColor)
      .text(`Status: ${consultationRequest.status.toUpperCase()}`, 50, 115, {
        align: 'center',
      })

    doc
      .fontSize(10)
      .fillColor('#7f8c8d')
      .text(`Generated PDF on ${currentDate}`, 50, 145, {
        align: 'center',
      })

    doc
      .strokeColor('#bdc3c7')
      .lineWidth(1)
      .moveTo(50, 165)
      .lineTo(545, 165)
      .stroke()
  }

  private static addConsultationDetails(
    doc: PDFKit.PDFDocument,
    consultationRequest: ConsultationMessageRecord
  ): void {
    let y = 185
    const leftColX = 50
    const valueX = leftColX + 170
    const valueWidth = 325

    const fullName = `${consultationRequest.first_name} ${consultationRequest.last_name}`.trim()

    doc.fontSize(18).fillColor('#2c3e50').text('Consultation Information', leftColX, y)
    y += 30

    doc.fontSize(12).fillColor('#34495e')

    y = this.addField(doc, 'Name:', fullName, leftColX, valueX, y, valueWidth)
    y = this.addField(doc, 'Preferred Contact:', this.formatValue(consultationRequest.contact_method), leftColX, valueX, y, valueWidth)

    if (consultationRequest.phone) {
      doc.fillColor('#34495e').font('Helvetica-Bold').text('Phone Number:', leftColX, y)
      doc
        .font('Helvetica')
        .fillColor('#3498db')
        .text(consultationRequest.phone, valueX, y, {
          width: valueWidth,
          link: `tel:${consultationRequest.phone}`,
          underline: true,
        })
      y += 25
    }

    if (consultationRequest.email) {
      doc.fillColor('#34495e').font('Helvetica-Bold').text('Email Address:', leftColX, y)
      doc
        .font('Helvetica')
        .fillColor('#3498db')
        .text(consultationRequest.email, valueX, y, {
          width: valueWidth,
          link: `mailto:${consultationRequest.email}`,
          underline: true,
        })
      y += 25
    }

    y += 10

    doc.fontSize(18).fillColor('#2c3e50').font('Helvetica-Bold').text('Care Information', leftColX, y)
    y += 30

    y = this.addField(
      doc,
      'Consultation For:',
      this.getPersonSeekingCareLabel(consultationRequest.person_seeking_care),
      leftColX,
      valueX,
      y,
      valueWidth
    )

    y = this.addField(
      doc,
      'Age Range:',
      this.formatValue(consultationRequest.age_range),
      leftColX,
      valueX,
      y,
      valueWidth
    )

    y = this.addField(
      doc,
      'Insurance Type:',
      this.getInsuranceLabel(consultationRequest.insurance_type),
      leftColX,
      valueX,
      y,
      valueWidth
    )

    y = this.addField(
      doc,
      'Placement Timeline:',
      this.formatValue(consultationRequest.placement),
      leftColX,
      valueX,
      y,
      valueWidth
    )

    if (consultationRequest.tags?.length) {
      y += 10
      doc.fillColor('#2c3e50').fontSize(16).font('Helvetica-Bold').text('Tags', leftColX, y)
      y += 25

      const tagsText = consultationRequest.tags.join(', ')
      doc.fillColor('#8e44ad').fontSize(12).font('Helvetica').text(tagsText, 80, y, {
        width: 400,
        align: 'left',
      })

      const tagsHeight = doc.heightOfString(tagsText, {
        width: 400,
        align: 'left',
      })

      y += tagsHeight + 15
    }

    doc.y = y
  }

  private static addCareAssessmentSection(
    doc: PDFKit.PDFDocument,
    consultationRequest: ConsultationMessageRecord
  ): void {
    const left = 50
    const questionX = 70
    const responseX = 400
    const pageBottomLimit = () => doc.page.height - 85

    let y = doc.y + 20

    if (y + 60 > pageBottomLimit()) {
      this.addFooter(doc, consultationRequest)
      doc.addPage()
      y = doc.page.margins.top
    }

    doc.fontSize(18).fillColor('#2c3e50').font('Helvetica-Bold').text('Care Assessment', left, y)
    y += 30

    doc
      .fontSize(11)
      .fillColor('#34495e')
      .font('Helvetica-Bold')
      .text('Question', questionX, y)

    doc.text('Response', responseX, y)

    y += 20

    doc
      .strokeColor('#d9dee3')
      .lineWidth(0.5)
      .moveTo(left, y)
      .lineTo(545, y)
      .stroke()

    y += 12

    for (const question of consultationRequest.questions ?? []) {
      if (y + 35 > pageBottomLimit()) {
        this.addFooter(doc, consultationRequest)
        doc.addPage()
        y = doc.page.margins.top
      }

      const label = this.getQuestionLabel(question.name)
      const response = this.formatValue(question.value)

      doc.fontSize(11).fillColor('#34495e').font('Helvetica-Bold')
      const questionHeight = doc.heightOfString(label, { width: 300 })

      doc.text(label, questionX, y, { width: 300 })

      doc.font('Helvetica').fillColor('#2c3e50').text(response, responseX, y, {
        width: 120,
      })

      y += Math.max(25, questionHeight + 10)
    }

    doc.y = y
  }

  private static addMessageSection(
    doc: PDFKit.PDFDocument,
    consultationRequest: ConsultationMessageRecord
  ): void {
    const left = 50
    const boxWidth = 495
    const pad = 10
    const gapBeforeTitle = 20
    const titleToBoxGap = 35

    const footerTopY = doc.page.height - 75
    const pageTop = () => doc.page.margins.top
    const pageBottomLimit = () => footerTopY - 8

    let y = doc.y + gapBeforeTitle

    if (y + 20 > pageBottomLimit()) {
      this.addFooter(doc, consultationRequest)
      doc.addPage()
      y = pageTop()
    }

    doc
      .fontSize(16)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('Message / Additional Information', left, y)

    y += titleToBoxGap

    doc.font('Helvetica').fontSize(11).fillColor('#2c3e50')

    let text = (consultationRequest.message ?? '').trim()

    while (text.length > 0) {
      const avail = pageBottomLimit() - y - pad * 2

      if (avail < doc.currentLineHeight()) {
        this.addFooter(doc, consultationRequest)
        doc.addPage()
        y = pageTop()
        continue
      }

      const opts = {
        width: boxWidth - pad * 2,
        align: 'left' as const,
        height: avail,
      }

      doc.font('Helvetica').fontSize(11).fillColor('#2c3e50')

      const fitted =
        doc.heightOfString(text, opts) > avail
          ? this.truncateText(doc, text, opts)
          : text

      const h = doc.heightOfString(fitted, opts)
      const boxHeight = h + pad * 2

      doc.save()
      doc
        .lineWidth(0.5)
        .fillColor('#f8f9fa')
        .rect(left, y, boxWidth, boxHeight)
        .fill()
        .strokeColor('#d9dee3')
        .rect(left, y, boxWidth, boxHeight)
        .stroke()
      doc.restore()

      doc.text(fitted, left + pad, y + pad, opts)

      y += boxHeight + 4
      text = text.slice(fitted.length).trimStart()

      if (text.length > 0 && pageBottomLimit() - y < doc.currentLineHeight()) {
        this.addFooter(doc, consultationRequest)
        doc.addPage()
        y = pageTop()
      }
    }

    doc.y = y
  }

  private static addField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    leftColX: number,
    valueX: number,
    y: number,
    valueWidth: number
  ): number {
    doc.fillColor('#34495e').fontSize(12).font('Helvetica-Bold').text(label, leftColX, y)

    const height = doc
      .font('Helvetica')
      .fillColor('#34495e')
      .heightOfString(value || '', { width: valueWidth })

    doc.text(value || '', valueX, y, { width: valueWidth })

    return y + Math.max(25, height + 10)
  }

  private static truncateText(
    doc: PDFKit.PDFDocument,
    text: string,
    opts: {
      width: number
      align: 'left' | 'center' | 'right' | 'justify'
      height: number
    }
  ): string {
    let lo = 1
    let hi = text.length
    let best = 1

    while (lo <= hi) {
      const mid = Math.ceil((lo + hi) / 2)
      const candidate = text.slice(0, mid)

      if (doc.heightOfString(candidate, opts) <= opts.height) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    const slice = text.slice(0, best)
    const lastSpace = slice.lastIndexOf(' ')

    return lastSpace > 0 ? slice.slice(0, lastSpace) : slice
  }

  private static addFooter(
    doc: PDFKit.PDFDocument,
    consultationRequest: ConsultationMessageRecord
  ): void {
    const fullName = `${consultationRequest.first_name} ${consultationRequest.last_name}`.trim()

    doc
      .strokeColor('#bdc3c7')
      .lineWidth(1)
      .moveTo(50, doc.page.height - 75)
      .lineTo(545, doc.page.height - 75)
      .stroke()

    const footerY = doc.page.height - 60

    doc.fontSize(8).fillColor('#7f8c8d').text(fullName, 50, footerY, {
      align: 'left',
    })

    if (!this.addedReviewedLine) {
      doc.fontSize(8).fillColor('#7f8c8d').text('Reviewed By: _______________', 0, footerY, {
        align: 'center',
        width: doc.page.width,
      })

      this.addedReviewedLine = true
    }

    doc.fontSize(8).fillColor('#7f8c8d').text('Consultation Request Management System', 0, footerY, {
      align: 'right',
      width: doc.page.width - 50,
    })
  }

  private static formatValue(value: string): string {
    const specialCases: Record<string, string> = {
      'va-benefits': 'VA Benefits',
      '1-3-months': '1-3 Months',
      '30-days': '30 Days',
      'no-answer': 'Prefer Not To Answer',
    }

    if (specialCases[value]) return specialCases[value]

    if (/^\d/.test(value)) return value

    return value
      .replaceAll('_', '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private static getQuestionLabel(name: string): string {
    const labels: Record<string, string> = {
      income_assistance: 'Income Assistance',
      ada_accommodations: 'ADA Accommodations',
      daily_living_assistance: 'Daily Living Assistance',
    }

    return labels[name] ?? this.formatValue(name)
  }

  private static getInsuranceLabel(
    insurance: ConsultationMessageRecord['insurance_type']
  ): string {
    if (insurance.value === 'other') {
      return `Other: ${insurance.other}`
    }

    return this.formatValue(insurance.value)
  }

  private static getPersonSeekingCareLabel(
    person: ConsultationMessageRecord['person_seeking_care']
  ): string {
    if (person.value === 'other') {
      return `Other: ${person.other}`
    }

    return this.formatValue(person.value)
  }

  private static getStatusColor(status: ConsultationFormStatus): string {
    const statusColors: Record<ConsultationFormStatus, string> = {
      new: '#2ecc71',
      reviewing: '#9b59b6',
      contacted: '#3498db',
      spam: '#e74c3c',
      closed: '#95a5a6',
    }

    return statusColors[status] || '#2c3e50'
  }
}