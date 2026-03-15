import { toSafeString } from '../helpers/safe'
import * as contactForm from '../services/contactForm.services'
import type { Request, Response } from 'express'

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const contactData = req.body

    const requiredFields = ['first_name', 'email', 'reason', 'contact_method', 'message']
    const missingFields = requiredFields.filter(field => !contactData[field])

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      })
      return
    }

    const results = await contactForm.submitContactForm(contactData)

    res.status(200).json({
      success: true,
      message: results.emailSuccess
        ? 'Contact form submitted successfully'
        : 'Contact form saved, but email failed to send',
      emailSuccess: results.emailSuccess,
      messageId: results.messageId,
      emailError: results.emailError,
      contactId: results.documentId
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    })
  }
}

export const getAllContactForms = async (req: Request, res: Response) => {
  try {
    const omit = req.query.omit !== 'false'
    const page = Number.parseInt(req.query.page as string) || 1
    const pageSize = Number.parseInt(req.query.limit as string) || Number.parseInt(req.query.pageSize as string) || 5

    const filters = {
      ...(req.query.status ? { status: req.query.status as string } : {}),
      ...(req.query.reason ? { reason: req.query.reason as string } : {})
    }

    const result = await contactForm.getAllContactForms(filters, omit, { page, pageSize })

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

export const getContactFormById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await contactForm.getContactFormById(id)

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

export const getContactFormsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params
    const page = Number.parseInt(req.query.page as string) || 1
    const pageSize = Number.parseInt(req.query.limit as string) || Number.parseInt(req.query.pageSize as string) || 5

    const filters = {
      ...(req.query.status ? { status: req.query.status as string } : {}),
      ...(req.query.reason ? { reason: req.query.reason as string } : {})
    }

    const result = await contactForm.getContactFormsByDate(date, filters, { page, pageSize })

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

export const getContactFormsByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    const page = Number.parseInt(req.query.page as string) || 1
    const pageSize = Number.parseInt(req.query.limit as string) || Number.parseInt(req.query.pageSize as string) || 5

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      })
      return
    }

    const filters = {
      ...(req.query.status ? { status: req.query.status as string } : {}),
      ...(req.query.reason ? { reason: req.query.reason as string } : {})
    }

    const result = await contactForm.getContactFormsByDateRange(
      { startDate: toSafeString(startDate), endDate: toSafeString(endDate) },
      filters,
      { page, pageSize }
    )

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

export const getContactFormsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params
    const page = Number.parseInt(req.query.page as string) || 1
    const pageSize = Number.parseInt(req.query.limit as string) || Number.parseInt(req.query.pageSize as string) || 5

    const result = await contactForm.getContactFormsByStatus({ status }, { page, pageSize })

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

export const updateContactFormStatus = async (req: Request, res: Response) => {
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

    const result = await contactForm.updateContactFormStatus(id, status)

    res.json({
      success: true,
      data: result,
      message: 'Contact form status updated successfully'
    })
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const updateContactFormTags = async (req: Request, res: Response) => {
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

    const result = await contactForm.updateContactFormTags(id, tags)

    res.json({
      success: true,
      data: result,
      message: 'Contact form tags updated successfully'
    })
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const deleteContactForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await contactForm.deleteContactForm(id)

    res.json({
      success: true,
      message: 'Contact form deleted successfully'
    })
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const createContactFormPDFById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const pdfBuffer = await contactForm.createContactFormPDFById(id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="contact-form-${id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    const message = (error as Error).message
    res.status(message.includes('not found') ? 404 : 500).json({
      success: false,
      message
    })
  }
}

export const createContactFormPDFBulk = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ids must be a non-empty array'
      })
      return
    }

    const zipBuffer = await contactForm.createContactFormPDFBulk(ids)

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="contact-forms.zip"')
    res.send(zipBuffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    })
  }
}