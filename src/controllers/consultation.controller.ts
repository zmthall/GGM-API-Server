import * as consultationService from '../services/consultation.services'
import type { Request, Response } from 'express'
import {
  CondensedConsultationData,
  ConsultationFormData
} from '../types/consultationForm'

export const submitConsultationForm = async (req: Request, res: Response) => {
  try {
    const consultationData: ConsultationFormData = req.body

    const condensedData: CondensedConsultationData = {
      ...consultationData.personal_information,
      ...consultationData.individual_care_information,
      message: consultationData.message
    }

    const requiredFields = [
      'first_name',
      'last_name',
      'message',
      consultationData.personal_information.contact_method
    ] as const

    const missingFields = requiredFields.filter(field => !condensedData[field])

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
      return
    }

    console.log(req.body.individual_care_information.age_range)

    const results = await consultationService.submitConsultationForm(condensedData)

    res.status(200).json({
      success: true,
      message: results.emailSuccess
        ? 'Consultation form submitted successfully'
        : 'Consultation form saved, but email failed to send',
      emailSuccess: results.emailSuccess,
      messageId: results.messageId,
      emailError: results.emailError,
      consultationRequestId: results.documentId
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    })
  }
}

export const getAllConsultationRequests = async (req: Request, res: Response) => {
  try {
    const omit = req.query.omit !== 'false'
    const page = Number.parseInt(req.query.page as string) || 1
    const pageSize =
      Number.parseInt(req.query.limit as string) ||
      Number.parseInt(req.query.pageSize as string) ||
      5

    const filters = {
      ...(req.query.status ? { status: req.query.status as string } : {}),
      ...(req.query.contact_type ? { contact_type: req.query.contact_type as string } : {})
    }

    const result = await consultationService.getAllConsultationRequests(filters, omit, {
      page,
      pageSize
    })

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}

export const getConsultationRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await consultationService.getConsultationRequestById(id)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    const message = (error as Error).message

    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const updateConsultationRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required'
      })
      return
    }

    const result = await consultationService.updateConsultationRequestStatus(id, status)

    res.json({
      success: true,
      data: result,
      message: 'Consultation request status updated successfully'
    })
  } catch (error) {
    const message = (error as Error).message

    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const updateConsultationRequestTags = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { tags } = req.body

    if (!Array.isArray(tags)) {
      res.status(400).json({
        success: false,
        message: 'Tags must be an array'
      })
      return
    }

    const result = await consultationService.updateConsultationRequestTags(id, tags)

    res.json({
      success: true,
      data: result,
      message: 'Consultation request tags updated successfully'
    })
  } catch (error) {
    const message = (error as Error).message

    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const deleteConsultationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await consultationService.deleteConsultationRequest(id)

    res.json({
      success: true,
      message: 'Consultation request deleted successfully'
    })
  } catch (error) {
    const message = (error as Error).message

    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const createConsultationRequestPDFById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const pdfBuffer = await consultationService.createConsultationRequestPDFById(id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="consultation-request-${id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    const message = (error as Error).message

    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}